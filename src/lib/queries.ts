import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  creditTransactions,
  products,
  testimonialRequests,
  testimonials,
  users,
  type Product,
  type Testimonial,
} from "./schema";

export function getOwnedProduct(userId: string): Product | undefined {
  return db.select().from(products).where(eq(products.ownerId, userId)).get();
}

export function getProductBySlug(slug: string): Product | undefined {
  return db.select().from(products).where(eq(products.slug, slug)).get();
}

export function listByStatus(productId: string, status: Testimonial["status"]) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.status, status)))
    .orderBy(desc(testimonials.submittedAt))
    .all();
}

export function listWall(productId: string) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.status, "approved")))
    .orderBy(asc(testimonials.displayOrder), desc(testimonials.submittedAt))
    .all();
}

export function countByStatus(productId: string): Record<string, number> {
  const rows = db
    .select({ status: testimonials.status, count: sql<number>`count(*)` })
    .from(testimonials)
    .where(eq(testimonials.productId, productId))
    .groupBy(testimonials.status)
    .all();
  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

export function openRequests(productId: string): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(testimonialRequests)
    .where(
      and(eq(testimonialRequests.productId, productId), eq(testimonialRequests.status, "open")),
    )
    .get();
  return Number(row?.count ?? 0);
}

export type ExploreItem = {
  product: Product;
  approvedCount: number;
  openRequests: number;
  alreadySubmitted: boolean;
  isOwn: boolean;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function exploreProducts(
  viewerId: string | null,
  query: string,
  category: string | null,
): ExploreItem[] {
  const viewer = viewerId ?? "";
  const term = `%${escapeLike(query)}%`;

  const rows = db
    .select({
      product: products,
      approvedCount: sql<number>`(
        select count(*) from testimonials t
        where t.product_id = ${products.id} and t.status = 'approved'
      )`,
      openRequests: sql<number>`(
        select count(*) from testimonial_requests r
        where r.product_id = ${products.id} and r.status = 'open'
      )`,
      alreadySubmitted: sql<number>`exists(
        select 1 from testimonials t
        where t.product_id = ${products.id} and t.author_id = ${viewer}
      )`,
    })
    .from(products)
    .where(
      and(
        eq(products.isPublic, true),
        query
          ? sql`(${products.name} like ${term} escape '\\' or ${products.description} like ${term} escape '\\')`
          : undefined,
        category ? eq(products.category, category) : undefined,
      ),
    )
    .orderBy(desc(products.createdAt))
    .all();

  return rows
    .map((row) => ({
      product: row.product,
      approvedCount: Number(row.approvedCount),
      openRequests: Number(row.openRequests),
      alreadySubmitted: Boolean(row.alreadySubmitted),
      isOwn: row.product.ownerId === viewerId,
    }))
    .sort((a, b) => b.openRequests - a.openRequests);
}

export function ledgerFor(userId: string) {
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .all();
}

export function submissionFor(productId: string, userId: string) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.authorId, userId)))
    .get();
}

export function ownerName(ownerId: string): string {
  return db.select({ name: users.name }).from(users).where(eq(users.id, ownerId)).get()?.name ?? "";
}
