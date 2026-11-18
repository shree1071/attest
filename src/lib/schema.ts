import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const now = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const identifier = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const users = pgTable(
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
    identityObservedAt: timestamp("identity_observed_at", { withTimezone: true }),
    isAdmin: boolean("is_admin").notNull().default(false),
    isRestricted: boolean("is_restricted").notNull().default(false),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_provider_subject_uq").on(t.provider, t.providerSubject),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: now(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const products = pgTable(
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
    isPublic: boolean("is_public").notNull().default(true),
    acceptingTestimonials: boolean("accepting_testimonials").notNull().default(true),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("products_owner_uq").on(t.ownerId),
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_public_idx").on(t.isPublic),
  ],
);

export const testimonials = pgTable(
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
    rating: integer("rating").notNull().default(5),
    sourceType: text("source_type", { enum: ["customer", "exchange"] }).notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected", "withdrawn"] })
      .notNull()
      .default("pending"),
    identitySnapshot: text("identity_snapshot").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: now(),
  },
  (t) => [
    uniqueIndex("testimonials_product_author_uq").on(t.productId, t.authorId),
    index("testimonials_product_status_idx").on(t.productId, t.status),
    index("testimonials_author_idx").on(t.authorId),
  ],
);

export const creditTransactions = pgTable(
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

export const testimonialRequests = pgTable(
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

export const auditEvents = pgTable(
  "audit_events",
  {
    id: identifier(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    metadata: text("metadata"),
    createdAt: now(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorId),
    index("audit_target_idx").on(t.targetType, t.targetId),
  ],
);

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type TestimonialRequest = typeof testimonialRequests.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
