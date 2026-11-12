import { eq, sql } from "drizzle-orm";
import { db, type Db } from "./db";
import { creditTransactions } from "./schema";

export const CREDITS_PER_REVIEW = 5;
export const CREDITS_PER_REQUEST = 1;

export function balanceOf(userId: string, executor: Db = db): number {
  const row = executor
    .select({
      total: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .get();

  return Number(row?.total ?? 0);
}

export function awardReviewCredits(
  executor: Db,
  userId: string,
  testimonialId: string,
): number {
  const balance = balanceOf(userId, executor);
  executor
    .insert(creditTransactions)
    .values({
      userId,
      amount: CREDITS_PER_REVIEW,
      transactionType: "earned",
      referenceTestimonialId: testimonialId,
      description: "Community testimonial submitted",
      balanceAfter: balance + CREDITS_PER_REVIEW,
    })
    .run();
  return balance + CREDITS_PER_REVIEW;
}

export function chargeForRequest(
  executor: Db,
  userId: string,
  requestId: string,
): number {
  const balance = balanceOf(userId, executor);
  if (balance < CREDITS_PER_REQUEST) {
    throw new Error("You need at least 1 credit to request a testimonial.");
  }
  executor
    .insert(creditTransactions)
    .values({
      userId,
      amount: -CREDITS_PER_REQUEST,
      transactionType: "spent",
      referenceRequestId: requestId,
      description: "Requested a marketplace testimonial",
      balanceAfter: balance - CREDITS_PER_REQUEST,
    })
    .run();
  return balance - CREDITS_PER_REQUEST;
}
