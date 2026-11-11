import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = () => integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());

const identifier = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const users = sqliteTable(
  "users",
  {
    id: identifier(),
    email: text("email"),
    name: text("name").notNull(),
    headline: text("headline"),
    headlineSource: text("headline_source", { enum: ["self_reported", "linkedin"] })
      .notNull()
      .default("self_reported"),
    identitySource: text("identity_source", { enum: ["demo", "linkedin"] })
      .notNull()
      .default("demo"),
    provider: text("provider"),
    providerSubject: text("provider_subject"),
    profileUrl: text("profile_url"),
    avatarUrl: text("avatar_url"),
    identityObservedAt: integer("identity_observed_at", { mode: "timestamp_ms" }),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_provider_subject_uq").on(t.provider, t.providerSubject),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: now(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const products = sqliteTable(
  "products",
  {
    id: identifier(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    category: text("category").notNull().default("SaaS"),
    logoKey: text("logo_key"),
    slug: text("slug").notNull(),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    acceptingTestimonials: integer("accepting_testimonials", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("products_owner_uq").on(t.ownerId),
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_public_idx").on(t.isPublic),
  ],
);

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: identifier(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    sourceType: text("source_type", { enum: ["customer", "exchange"] }).notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected", "withdrawn"] })
      .notNull()
      .default("pending"),
    identitySnapshot: text("identity_snapshot").notNull(),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }).notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    rejectedAt: integer("rejected_at", { mode: "timestamp_ms" }),
    withdrawnAt: integer("withdrawn_at", { mode: "timestamp_ms" }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("testimonials_product_author_uq").on(t.productId, t.authorId),
    index("testimonials_product_status_idx").on(t.productId, t.status),
    index("testimonials_author_idx").on(t.authorId),
  ],
);

export const creditTransactions = sqliteTable(
  "credit_transactions",
  {
    id: identifier(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    transactionType: text("transaction_type", {
      enum: ["earned", "spent", "refund", "adjustment"],
    }).notNull(),
    referenceTestimonialId: text("reference_testimonial_id"),
    referenceRequestId: text("reference_request_id"),
    description: text("description"),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("credit_tx_testimonial_uq").on(t.referenceTestimonialId),
    uniqueIndex("credit_tx_request_uq").on(t.referenceRequestId),
    index("credit_tx_user_idx").on(t.userId),
    check("credit_tx_amount_nonzero", sql`${t.amount} <> 0`),
    check("credit_tx_balance_nonnegative", sql`${t.balanceAfter} >= 0`),
  ],
);

export const testimonialRequests = sqliteTable(
  "testimonial_requests",
  {
    id: identifier(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["open", "fulfilled"] })
      .notNull()
      .default("open"),
    fulfilledTestimonialId: text("fulfilled_testimonial_id"),
    createdAt: now(),
  },
  (t) => [
    index("requests_product_status_idx").on(t.productId, t.status),
    uniqueIndex("requests_fulfilled_uq").on(t.fulfilledTestimonialId),
  ],
);

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type TestimonialRequest = typeof testimonialRequests.$inferSelect;
