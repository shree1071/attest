import { eq, sql } from "drizzle-orm";
import { db, type DbExecutor } from "./db";
import { creditTransactions } from "./schema";

export const CREDITS_PER_REVIEW = 5;
export const CREDITS_PER_REQUEST = 1;

export async function balanceOf(userId: string, executor: DbExecutor = db): Promise<number> {
  const rows = await executor
    .select({
      total: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId));

  return Number(rows[0]?.total ?? 0);
}

export async function awardReviewCredits(
  executor: DbExecutor,
  userId: string,
  testimonialId: string,
): Promise<number> {
  const balance = await balanceOf(userId, executor);
  await executor.insert(creditTransactions).values({
    userId,
    amount: CREDITS_PER_REVIEW,
    transactionType: "earned",
    referenceTestimonialId: testimonialId,
    description: "Community testimonial submitted",
    balanceAfter: balance + CREDITS_PER_REVIEW,
  });
  return balance + CREDITS_PER_REVIEW;
}

export async function chargeForRequest(
  executor: DbExecutor,
  userId: string,
  requestId: string,
): Promise<number> {
  const balance = await balanceOf(userId, executor);
  if (balance < CREDITS_PER_REQUEST) {
    throw new Error("You need at least 1 credit to request a testimonial.");
  }
  await executor.insert(creditTransactions).values({
    userId,
    amount: -CREDITS_PER_REQUEST,
    transactionType: "spent",
    referenceRequestId: requestId,
    description: "Requested a marketplace testimonial",
    balanceAfter: balance - CREDITS_PER_REQUEST,
  });
  return balance - CREDITS_PER_REQUEST;
}
