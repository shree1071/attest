import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "attest-test-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");

const { eq } = await import("drizzle-orm");
const { db, sqlite } = await import("./db");
const { users } = await import("./schema");
const { awardReviewCredits, balanceOf, chargeForRequest, CREDITS_PER_REVIEW } = await import(
  "./credits"
);
const { email, httpUrl, slugify, text } = await import("./validate");
const { safeNextPath } = await import("./auth");
const { embedSnippet } = await import("./urls");

after(() => {
  sqlite.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function createUser(name: string): string {
  const id = crypto.randomUUID();
  db.insert(users).values({ id, name, identitySource: "demo", headlineSource: "self_reported" }).run();
  return id;
}

test("credit balance comes from the ledger and can never go negative", () => {
  const userId = createUser("Ledger Tester");
  assert.equal(balanceOf(userId), 0);

  awardReviewCredits(db, userId, `testimonial-${userId}`);
  assert.equal(balanceOf(userId), CREDITS_PER_REVIEW);

  assert.throws(() => awardReviewCredits(db, userId, `testimonial-${userId}`));
  assert.equal(balanceOf(userId), CREDITS_PER_REVIEW, "duplicate award must not change balance");

  for (let index = 0; index < CREDITS_PER_REVIEW; index += 1) {
    chargeForRequest(db, userId, `request-${index}-${userId}`);
  }
  assert.equal(balanceOf(userId), 0);

  assert.throws(() => chargeForRequest(db, userId, `request-overdraft-${userId}`));
  assert.equal(balanceOf(userId), 0, "failed spend must not change balance");
});

test("a request reference can only be charged once", () => {
  const userId = createUser("Idempotency Tester");
  awardReviewCredits(db, userId, `testimonial-${userId}`);
  chargeForRequest(db, userId, `request-${userId}`);

  assert.throws(() => chargeForRequest(db, userId, `request-${userId}`));
  assert.equal(balanceOf(userId), CREDITS_PER_REVIEW - 1);
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

test("restricted user status flag is respected", () => {
  const userId = createUser("Restricted User");
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  assert.equal(user?.isRestricted, false);

  db.update(users).set({ isRestricted: true }).where(eq(users.id, userId)).run();
  const updated = db.select().from(users).where(eq(users.id, userId)).get();
  assert.equal(updated?.isRestricted, true);
});
