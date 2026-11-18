/**
 * Bundled demo database (PGlite).
 *
 * This module is loaded lazily, and only when demo mode is explicitly enabled
 * (`ATTEST_DEMO_DB=1`) or `DATABASE_URL` is absent. It provides real Postgres
 * semantics in-memory, so the same Drizzle schema, queries and transactions run
 * without a network connection. Data is seeded on boot and resets on restart.
 */

export type SqlResult = {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: { name: string }[];
};

export type SqlClient = {
  query: (config: unknown, params?: unknown[]) => Promise<SqlResult>;
  release: () => void;
};

const DDL = `
create table if not exists "users" (
  "id" text primary key,
  "email" text,
  "name" text not null,
  "headline" text,
  "headline_source" text not null default 'self_reported',
  "identity_source" text not null default 'demo',
  "provider" text,
  "provider_subject" text,
  "profile_url" text,
  "avatar_url" text,
  "identity_observed_at" timestamptz,
  "is_admin" boolean not null default false,
  "is_restricted" boolean not null default false,
  "created_at" timestamptz not null default now()
);
create unique index if not exists "users_email_uq" on "users" ("email");
create unique index if not exists "users_provider_subject_uq" on "users" ("provider", "provider_subject");

create table if not exists "sessions" (
  "id" text primary key,
  "user_id" text not null references "users" ("id") on delete cascade,
  "expires_at" timestamptz not null,
  "created_at" timestamptz not null default now()
);
create index if not exists "sessions_user_idx" on "sessions" ("user_id");

create table if not exists "products" (
  "id" text primary key,
  "owner_id" text not null references "users" ("id") on delete cascade,
  "name" text not null,
  "description" text not null,
  "website_url" text not null,
  "category" text not null default 'SaaS',
  "logo_key" text,
  "slug" text not null,
  "is_public" boolean not null default true,
  "accepting_testimonials" boolean not null default true,
  "created_at" timestamptz not null default now()
);
create unique index if not exists "products_owner_uq" on "products" ("owner_id");
create unique index if not exists "products_slug_uq" on "products" ("slug");
create index if not exists "products_public_idx" on "products" ("is_public");

create table if not exists "testimonials" (
  "id" text primary key,
  "product_id" text not null references "products" ("id") on delete cascade,
  "author_id" text not null references "users" ("id") on delete cascade,
  "content" text not null,
  "rating" integer not null default 5,
  "source_type" text not null,
  "status" text not null default 'pending',
  "identity_snapshot" text not null,
  "consent_at" timestamptz not null,
  "submitted_at" timestamptz not null default now(),
  "approved_at" timestamptz,
  "rejected_at" timestamptz,
  "withdrawn_at" timestamptz,
  "display_order" integer not null default 0,
  "created_at" timestamptz not null default now()
);
create unique index if not exists "testimonials_product_author_uq" on "testimonials" ("product_id", "author_id");
create index if not exists "testimonials_product_status_idx" on "testimonials" ("product_id", "status");
create index if not exists "testimonials_author_idx" on "testimonials" ("author_id");

create table if not exists "credit_transactions" (
  "id" text primary key,
  "user_id" text not null references "users" ("id") on delete cascade,
  "amount" integer not null,
  "transaction_type" text not null,
  "reference_testimonial_id" text,
  "reference_request_id" text,
  "description" text,
  "balance_after" integer not null,
  "created_at" timestamptz not null default now(),
  constraint "credit_tx_amount_nonzero" check ("amount" <> 0),
  constraint "credit_tx_balance_nonnegative" check ("balance_after" >= 0)
);
create unique index if not exists "credit_tx_testimonial_uq" on "credit_transactions" ("reference_testimonial_id");
create unique index if not exists "credit_tx_request_uq" on "credit_transactions" ("reference_request_id");
create index if not exists "credit_tx_user_idx" on "credit_transactions" ("user_id");

create table if not exists "testimonial_requests" (
  "id" text primary key,
  "product_id" text not null references "products" ("id") on delete cascade,
  "status" text not null default 'open',
  "fulfilled_testimonial_id" text,
  "created_at" timestamptz not null default now()
);
create index if not exists "requests_product_status_idx" on "testimonial_requests" ("product_id", "status");
create unique index if not exists "requests_fulfilled_uq" on "testimonial_requests" ("fulfilled_testimonial_id");

create table if not exists "audit_events" (
  "id" text primary key,
  "actor_id" text not null references "users" ("id") on delete cascade,
  "action" text not null,
  "target_type" text not null,
  "target_id" text not null,
  "reason" text,
  "metadata" text,
  "created_at" timestamptz not null default now()
);
create index if not exists "audit_actor_idx" on "audit_events" ("actor_id");
create index if not exists "audit_target_idx" on "audit_events" ("target_type", "target_id");
`;

type SeedUser = {
  id: string;
  name: string;
  email: string;
  headline: string;
  linkedin: boolean;
  admin?: boolean;
};

const USERS: SeedUser[] = [
  {
    id: "demo-user-founder",
    name: "Demo Founder",
    email: "demo@attest.app",
    headline: "Founder at Attest Demo",
    linkedin: false,
    admin: true,
  },
  {
    id: "demo-user-maya",
    name: "Maya Chen",
    email: "maya@example.com",
    headline: "Co-founder at Northwind",
    linkedin: true,
  },
  {
    id: "demo-user-sam",
    name: "Sam Taylor",
    email: "sam@example.com",
    headline: "Founder at Ledgerly",
    linkedin: true,
  },
  {
    id: "demo-user-priya",
    name: "Priya Sharma",
    email: "priya@example.com",
    headline: "Business Analyst",
    linkedin: false,
  },
  {
    id: "demo-user-amit",
    name: "Amit Patel",
    email: "amit@example.com",
    headline: "Product Lead",
    linkedin: true,
  },
  {
    id: "demo-user-sneha",
    name: "Sneha Reddy",
    email: "sneha@example.com",
    headline: "Tech Lead",
    linkedin: false,
  },
];

type SeedProduct = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    id: "demo-product-attest",
    ownerId: "demo-user-founder",
    name: "Attest Demo",
    slug: "attest-demo",
    description:
      "The demo wall for Attest — a testimonial platform for founders who are early.",
    category: "SaaS",
  },
  {
    id: "demo-product-northwind",
    ownerId: "demo-user-maya",
    name: "Northwind CRM",
    slug: "northwind",
    description:
      "A deliberately small CRM for founders who live in their inbox. Pipelines, notes and follow-ups without the enterprise bloat.",
    category: "SaaS",
  },
  {
    id: "demo-product-ledgerly",
    ownerId: "demo-user-sam",
    name: "Ledgerly",
    slug: "ledgerly",
    description:
      "Server-enforced double-entry bookkeeping for indie products. One ledger, no spreadsheets.",
    category: "Fintech",
  },
  {
    id: "demo-product-pixelbook",
    ownerId: "demo-user-priya",
    name: "Pixelbook Studio",
    slug: "pixelbook",
    description:
      "A calm design workspace for small teams. Boards, specs and handoff in one place.",
    category: "Design",
  },
];

type SeedTestimonial = {
  id: string;
  productId: string;
  authorId: string;
  content: string;
  rating: number;
  sourceType: "customer" | "exchange";
  status: "approved" | "pending";
  daysAgo: number;
  order: number;
};

const TESTIMONIALS: SeedTestimonial[] = [
  {
    id: "demo-t-attest-1",
    productId: "demo-product-attest",
    authorId: "demo-user-sam",
    content:
      "Attest replaced a Notion page, a Typeform and a folder of screenshots. I sent one collection link to five customers and had a wall worth embedding the same afternoon.",
    rating: 5,
    sourceType: "exchange",
    status: "approved",
    daysAgo: 2,
    order: 0,
  },
  {
    id: "demo-t-attest-2",
    productId: "demo-product-attest",
    authorId: "demo-user-amit",
    content:
      "The identity snapshot is the detail I did not know I needed. Testimonials keep their author context even after someone changes their LinkedIn headline.",
    rating: 5,
    sourceType: "customer",
    status: "approved",
    daysAgo: 5,
    order: 1,
  },
  {
    id: "demo-t-attest-3",
    productId: "demo-product-attest",
    authorId: "demo-user-sneha",
    content:
      "Approval flow is exactly right: submissions land in an inbox, nothing goes public until I say so. The embed was one line and matched our site on the first try.",
    rating: 4,
    sourceType: "customer",
    status: "approved",
    daysAgo: 9,
    order: 2,
  },
  {
    id: "demo-t-attest-4",
    productId: "demo-product-attest",
    authorId: "demo-user-priya",
    content:
      "The credit exchange is a clever way to get a first testimonial when nobody knows you yet. I reviewed a product, earned credits, and got a review back within a day.",
    rating: 5,
    sourceType: "exchange",
    status: "pending",
    daysAgo: 0,
    order: 3,
  },
  {
    id: "demo-t-northwind-1",
    productId: "demo-product-northwind",
    authorId: "demo-user-founder",
    content:
      "We moved from a spreadsheet pipeline to Northwind in an afternoon. The follow-up reminders alone recovered two deals I had forgotten about.",
    rating: 5,
    sourceType: "exchange",
    status: "approved",
    daysAgo: 4,
    order: 0,
  },
  {
    id: "demo-t-northwind-2",
    productId: "demo-product-northwind",
    authorId: "demo-user-priya",
    content:
      "Genuinely small in the good way. Every screen is one decision, and the notes sit next to the deal instead of in a separate tab.",
    rating: 4,
    sourceType: "customer",
    status: "approved",
    daysAgo: 12,
    order: 1,
  },
  {
    id: "demo-t-northwind-3",
    productId: "demo-product-northwind",
    authorId: "demo-user-sneha",
    content:
      "Onboarding was quick and the pricing is honest. I recommend it to founders who do not want to administer a CRM.",
    rating: 5,
    sourceType: "customer",
    status: "approved",
    daysAgo: 18,
    order: 2,
  },
  {
    id: "demo-t-ledgerly-1",
    productId: "demo-product-ledgerly",
    authorId: "demo-user-founder",
    content:
      "The ledger is enforced on the server, which is exactly what I wanted after one too many spreadsheet mistakes. Month-end took ten minutes.",
    rating: 5,
    sourceType: "exchange",
    status: "approved",
    daysAgo: 7,
    order: 0,
  },
  {
    id: "demo-t-ledgerly-2",
    productId: "demo-product-ledgerly",
    authorId: "demo-user-maya",
    content:
      "Clean import from our old export and a sane chart of accounts. It does not try to be a bank, and that is the point.",
    rating: 4,
    sourceType: "customer",
    status: "approved",
    daysAgo: 21,
    order: 1,
  },
  {
    id: "demo-t-pixelbook-1",
    productId: "demo-product-pixelbook",
    authorId: "demo-user-amit",
    content:
      "Handoff used to be a folder of screenshots and a long message. Now the spec lives next to the board and engineering stops asking me which state is final.",
    rating: 5,
    sourceType: "customer",
    status: "approved",
    daysAgo: 15,
    order: 0,
  },
];

const REQUESTS = [
  { id: "demo-request-attest", productId: "demo-product-attest" },
  { id: "demo-request-ledgerly", productId: "demo-product-ledgerly" },
  { id: "demo-request-pixelbook", productId: "demo-product-pixelbook" },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function snapshotFor(user: SeedUser, at: Date): string {
  return JSON.stringify({
    schema_version: 1,
    identity_source: user.linkedin ? "linkedin" : "demo",
    provider: user.linkedin ? "linkedin" : null,
    provider_subject: user.linkedin ? `demo-${user.id}` : null,
    display_name: user.name,
    headline: user.headline,
    headline_source: "self_reported",
    profile_url: user.linkedin ? `https://www.linkedin.com/in/${user.email.split("@")[0]}` : null,
    avatar_url: null,
    observed_at: at.toISOString(),
    submitted_at: at.toISOString(),
  });
}

async function seed(client: SqlClient): Promise<void> {
  const usersById = new Map(USERS.map((user) => [user.id, user]));

  for (const user of USERS) {
    await client.query(
      `insert into "users" (id, email, name, headline, headline_source, identity_source, provider, provider_subject, profile_url, identity_observed_at, is_admin, is_restricted, created_at)
       values ($1,$2,$3,$4,'self_reported',$5,$6,$7,$8,$9,$10,false,$11)
       on conflict (id) do nothing`,
      [
        user.id,
        user.email,
        user.name,
        user.headline,
        user.linkedin ? "linkedin" : "demo",
        user.linkedin ? "linkedin" : "demo",
        user.linkedin ? `demo-${user.id}` : null,
        user.linkedin ? `https://www.linkedin.com/in/${user.email.split("@")[0]}` : null,
        daysAgo(30),
        Boolean(user.admin),
        daysAgo(30),
      ],
    );
  }

  for (const product of PRODUCTS) {
    await client.query(
      `insert into "products" (id, owner_id, name, description, website_url, category, slug, is_public, accepting_testimonials, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,true,true,$8)
       on conflict (id) do nothing`,
      [
        product.id,
        product.ownerId,
        product.name,
        product.description,
        `https://${product.slug}.example.com`,
        product.category,
        product.slug,
        daysAgo(28),
      ],
    );
  }

  for (const item of TESTIMONIALS) {
    const author = usersById.get(item.authorId)!;
    const submitted = daysAgo(item.daysAgo);
    const approved = item.status === "approved" ? submitted : null;
    await client.query(
      `insert into "testimonials" (id, product_id, author_id, content, rating, source_type, status, identity_snapshot, consent_at, submitted_at, approved_at, display_order, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,$9)
       on conflict (id) do nothing`,
      [
        item.id,
        item.productId,
        item.authorId,
        item.content,
        item.rating,
        item.sourceType,
        item.status,
        snapshotFor(author, submitted),
        submitted,
        approved,
        item.order,
      ],
    );
  }

  for (const request of REQUESTS) {
    await client.query(
      `insert into "testimonial_requests" (id, product_id, status, created_at)
       values ($1,$2,'open',$3)
       on conflict (id) do nothing`,
      [request.id, request.productId, daysAgo(3)],
    );
  }

  // Ledger for the demo founder: two earned reviews and one spent request → 9 credits.
  const ledger = [
    ["demo-credit-1", 5, "earned", "demo-t-northwind-1", null, "Community testimonial submitted", 5, 6],
    ["demo-credit-2", 5, "earned", "demo-t-ledgerly-1", null, "Community testimonial submitted", 10, 4],
    ["demo-credit-3", -1, "spent", null, "demo-request-attest", "Requested a marketplace testimonial", 9, 1],
  ] as const;

  for (const [id, amount, type, testimonialId, requestId, description, balance, ago] of ledger) {
    await client.query(
      `insert into "credit_transactions" (id, user_id, amount, transaction_type, reference_testimonial_id, reference_request_id, description, balance_after, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [
        id,
        "demo-user-founder",
        amount,
        type,
        testimonialId,
        requestId,
        description,
        balance,
        daysAgo(ago),
      ],
    );
  }
}

async function createClient(): Promise<SqlClient> {
  const { PGlite } = await import("@electric-sql/pglite");
  const lite = new PGlite();
  await lite.exec(DDL);

  const client: SqlClient = {
    async query(config, params = []) {
      const text =
        typeof config === "string" ? config : String((config as { text?: string })?.text ?? "");
      const rowMode = (config as { rowMode?: string })?.rowMode === "array" ? "array" : "object";
      const result = await lite.query(text, params, { rowMode: rowMode as "array" | "object" });
      return {
        rows: result.rows as Record<string, unknown>[],
        rowCount: result.affectedRows ?? result.rows.length,
        fields: (result.fields ?? []).map((field) => ({ name: field.name })),
      };
    },
    release() {
      // The demo backend is a single in-memory connection; nothing to release.
    },
  };

  await seed(client);
  return client;
}

let clientPromise: Promise<SqlClient> | undefined;

export function getDemoClient(): Promise<SqlClient> {
  clientPromise ??= createClient();
  return clientPromise;
}
