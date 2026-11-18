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

export async function getOwnedProduct(userId: string): Promise<Product | undefined> {
  const rows = await db.select().from(products).where(eq(products.ownerId, userId)).limit(1);
  return rows[0];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0];
}

export async function listByStatus(productId: string, status: Testimonial["status"]) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.status, status)))
    .orderBy(desc(testimonials.submittedAt));
}

export async function listWall(productId: string) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.status, "approved")))
    .orderBy(asc(testimonials.displayOrder), desc(testimonials.submittedAt));
}

export async function countByStatus(productId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: testimonials.status, count: sql<number>`count(*)` })
    .from(testimonials)
    .where(eq(testimonials.productId, productId))
    .groupBy(testimonials.status);
  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

export async function openRequests(productId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(testimonialRequests)
    .where(
      and(eq(testimonialRequests.productId, productId), eq(testimonialRequests.status, "open")),
    );
  return Number(rows[0]?.count ?? 0);
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

export async function exploreProducts(
  viewerId: string | null,
  query: string,
  category: string | null,
): Promise<ExploreItem[]> {
  const viewer = viewerId ?? "";
  const term = `%${escapeLike(query)}%`;

  const rows = await db
    .select({
      product: products,
      approvedCount: sql<number>`(
        select count(*) from testimonials t
        where t.product_id = products.id and t.status = 'approved'
      )`,
      openRequests: sql<number>`(
        select count(*) from testimonial_requests r
        where r.product_id = products.id and r.status = 'open'
      )`,
      alreadySubmitted: sql<boolean>`exists(
        select 1 from testimonials t
        where t.product_id = products.id and t.author_id = ${viewer}
      )`,    })
    .from(products)
    .where(
      and(
        eq(products.isPublic, true),
        query
          ? sql`(${products.name} ilike ${term} escape '\\' or ${products.description} ilike ${term} escape '\\')`
          : undefined,
        category ? eq(products.category, category) : undefined,
      ),
    )
    .orderBy(desc(products.createdAt));

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

export async function ledgerFor(userId: string) {
  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt));
}

export async function submissionFor(productId: string, userId: string) {
  const rows = await db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.productId, productId), eq(testimonials.authorId, userId)))
    .limit(1);
  return rows[0];
}

export async function ownerName(ownerId: string): Promise<string> {
  const rows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);
  return rows[0]?.name ?? "";
}

export type PublicTestimonialRow = {
  testimonial: Testimonial;
  productName: string;
  productSlug: string;
  productLogoKey: string | null;
};

/** Approved testimonials on public walls, newest first — used for landing-page proof. */
export async function recentPublicTestimonials(limit = 3): Promise<PublicTestimonialRow[]> {
  const rows = await db
    .select({
      testimonial: testimonials,
      productName: products.name,
      productSlug: products.slug,
      productLogoKey: products.logoKey,
    })
    .from(testimonials)
    .innerJoin(products, eq(testimonials.productId, products.id))
    .where(and(eq(testimonials.status, "approved"), eq(products.isPublic, true)))
    .orderBy(desc(testimonials.approvedAt), desc(testimonials.submittedAt))
    .limit(limit);

  return rows.map((row) => ({
    testimonial: row.testimonial,
    productName: row.productName,
    productSlug: row.productSlug,
    productLogoKey: row.productLogoKey,
  }));
}

export async function publicWallStats(): Promise<{ approved: number; walls: number }> {
  const rows = await db
    .select({
      approved: sql<number>`count(*)`,
      walls: sql<number>`count(distinct ${testimonials.productId})`,
    })
    .from(testimonials)
    .innerJoin(products, eq(testimonials.productId, products.id))
    .where(and(eq(testimonials.status, "approved"), eq(products.isPublic, true)));

  return { approved: Number(rows[0]?.approved ?? 0), walls: Number(rows[0]?.walls ?? 0) };
}
