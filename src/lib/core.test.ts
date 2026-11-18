import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, test } from "node:test";

// Database-backed tests run only when an explicit test database is provided.
// Create its schema first with:
//   TEST_DATABASE_URL=... npx drizzle-kit push --url "$TEST_DATABASE_URL"
const databaseUrl = process.env.TEST_DATABASE_URL;
const dbTest = databaseUrl ? test : test.skip;

type DbModule = typeof import("./db");
type SchemaModule = typeof import("./schema");
type CreditsModule = typeof import("./credits");

let dbModule: DbModule | undefined;
let schema: SchemaModule | undefined;
let credits: CreditsModule | undefined;

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  dbModule = await import("./db");
  schema = await import("./schema");
  credits = await import("./credits");
}

const createdUserIds: string[] = [];

after(async () => {
  if (!dbModule || !schema) return;
  if (createdUserIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    await dbModule.db.delete(schema.users).where(inArray(schema.users.id, createdUserIds));
  }
  await dbModule.pool.end();
});

async function createUser(name: string): Promise<string> {
  if (!dbModule || !schema) throw new Error("TEST_DATABASE_URL is required");
  const id = crypto.randomUUID();
  await dbModule.db
    .insert(schema.users)
    .values({ id, name, identitySource: "demo", headlineSource: "self_reported" });
  createdUserIds.push(id);
  return id;
}

const { email, httpUrl, slugify, text } = await import("./validate");
const { safeNextPath } = await import("./auth");
const { embedSnippet } = await import("./urls");

dbTest("credit balance comes from the ledger and can never go negative", async () => {
  if (!dbModule || !credits) throw new Error("TEST_DATABASE_URL is required");
  const userId = await createUser("Ledger Tester");
  assert.equal(await credits.balanceOf(userId), 0);

  await credits.awardReviewCredits(dbModule.db, userId, `testimonial-${userId}`);
  assert.equal(await credits.balanceOf(userId), credits.CREDITS_PER_REVIEW);

  await assert.rejects(
    credits.awardReviewCredits(dbModule.db, userId, `testimonial-${userId}`),
  );
  assert.equal(
    await credits.balanceOf(userId),
    credits.CREDITS_PER_REVIEW,
    "duplicate award must not change balance",
  );

  for (let index = 0; index < credits.CREDITS_PER_REVIEW; index += 1) {
    await credits.chargeForRequest(dbModule.db, userId, `request-${index}-${userId}`);
  }
  assert.equal(await credits.balanceOf(userId), 0);

  await assert.rejects(
    credits.chargeForRequest(dbModule.db, userId, `request-overdraft-${userId}`),
  );
  assert.equal(await credits.balanceOf(userId), 0, "failed spend must not change balance");
});

dbTest("a request reference can only be charged once", async () => {
  if (!dbModule || !credits) throw new Error("TEST_DATABASE_URL is required");
  const userId = await createUser("Idempotency Tester");
  await credits.awardReviewCredits(dbModule.db, userId, `testimonial-${userId}`);
  await credits.chargeForRequest(dbModule.db, userId, `request-${userId}`);

  await assert.rejects(
    credits.chargeForRequest(dbModule.db, userId, `request-${userId}`),
  );
  assert.equal(await credits.balanceOf(userId), credits.CREDITS_PER_REVIEW - 1);
});

test("testimonial text is trimmed and bounded", () => {
  assert.equal(text("  hello world  ", { label: "Text", min: 5, max: 20 }), "hello world");
  assert.throws(() => text("   short   ", { label: "Text", min: 10, max: 20 }));
  assert.throws(() => text("x".repeat(30), { label: "Text", min: 1, max: 20 }));
});

test("email is normalised and validated", () => {
  assert.equal(email("  ADA@Example.COM "), "ada@example.com");
  assert.throws(() => email("not-an-email"));
});

test("website URLs must be http(s), domain-based, and credential-free", () => {
  assert.equal(httpUrl("https://example.com/path", "Website"), "https://example.com/path");
  assert.throws(() => httpUrl("javascript:alert(1)", "Website"));
  assert.throws(() => httpUrl("https://user:pass@example.com", "Website"));
  assert.throws(() => httpUrl("https://localhost", "Website"));
});

test("slugs are lowercase, bounded, and URL safe", () => {
  assert.equal(slugify("  My Product!! v2 "), "my-product-v2");
  assert.equal(slugify("---"), "");
  assert.ok(slugify("a".repeat(100)).length <= 48);
});

test("redirect targets cannot leave the site", () => {
  assert.equal(safeNextPath("/dashboard/inbox?tab=pending"), "/dashboard/inbox?tab=pending");
  assert.equal(safeNextPath("//evil.example"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.example"), "/dashboard");
  assert.equal(safeNextPath("https://evil.example"), "/dashboard");
  assert.equal(safeNextPath("/ok\nset-cookie: x"), "/dashboard");
});

test("embed snippets escape attribute values", () => {
  const snippet = embedSnippet("https://attest.example/wall/demo?embed=1", 'Demo "Rated" & <Co>');
  assert.match(snippet, /src="https:\/\/attest\.example\/wall\/demo\?embed=1"/);
  assert.match(snippet, /title="Demo &quot;Rated&quot; &amp; &lt;Co&gt; testimonials"/);
  assert.ok(!snippet.includes("<Co>"));
});

test("rating must be clamped between 1 and 5", () => {
  const clampRating = (raw: number) => Math.min(5, Math.max(1, isNaN(raw) ? 5 : Math.round(raw)));
  assert.equal(clampRating(5), 5);
  assert.equal(clampRating(1), 1);
  assert.equal(clampRating(6), 5);
  assert.equal(clampRating(0), 1);
  assert.equal(clampRating(-10), 1);
  assert.equal(clampRating(4.2), 4);
});

dbTest("restricted user status flag is respected", async () => {
  if (!dbModule || !schema) throw new Error("TEST_DATABASE_URL is required");
  const { eq } = await import("drizzle-orm");
  const userId = await createUser("Restricted User");
  const rows = await dbModule.db.select().from(schema.users).where(eq(schema.users.id, userId));
  assert.equal(rows[0]?.isRestricted, false);

  await dbModule.db
    .update(schema.users)
    .set({ isRestricted: true })
    .where(eq(schema.users.id, userId));
  const updated = await dbModule.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  assert.equal(updated[0]?.isRestricted, true);
});
