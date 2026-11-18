"use server";

import crypto from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { awardReviewCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { buildIdentitySnapshot } from "@/lib/identity";
import { notifyOwnerNewSubmission, notifyReviewerApproved } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  products,
  testimonialRequests,
  testimonials,
  users,
} from "@/lib/schema";
import { checkbox, text } from "@/lib/validate";
import type { FormState } from "@/lib/action-state";

function isUniqueViolation(error: unknown): boolean {
  const pgError = error as { code?: string; constraint?: string };
  return (
    pgError?.code === "23505" &&
    (pgError.constraint === "testimonials_product_author_uq" ||
      pgError.constraint === "credit_tx_testimonial_uq" ||
      pgError.constraint === "credit_tx_request_uq" ||
      pgError.constraint === "requests_fulfilled_uq")
  );
}

async function submitTestimonial(
  formData: FormData,
  sourceType: "customer" | "exchange",
): Promise<FormState> {
  const slug = String(formData.get("slug") ?? "");
  const returnTo = sourceType === "exchange" ? `/product/${slug}` : `/collect/${slug}`;
  const user = await requireUser(returnTo);

  try {
    const content = text(formData.get("content"), {
      label: "Testimonial",
      min: 100,
      max: 5000,
    });
    if (!checkbox(formData.get("consent"))) {
      throw new ValidationError("Please confirm you allow this testimonial to be published.");
    }

    const turnstileToken = formData.get("cf-turnstile-response") as string | null;
    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      throw new ValidationError("Anti-bot verification failed. Please try again.");
    }
    const rawRating = Number(formData.get("rating") || 5);
    const rating = Math.min(5, Math.max(1, isNaN(rawRating) ? 5 : Math.round(rawRating)));

    const snapshot = buildIdentitySnapshot(user);

    await db.transaction(async (tx) => {
      const dbUserRows = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      if (dbUserRows[0]?.isRestricted) {
        throw new ValidationError("Your account is restricted from submitting testimonials.");
      }

      const productRows = await tx
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      const product = productRows[0];
      if (!product || !product.isPublic) {
        throw new ValidationError("This product page is not available.");
      }
      if (!product.acceptingTestimonials) {
        throw new ValidationError("This product is not accepting new testimonials right now.");
      }
      if (product.ownerId === user.id) {
        throw new ValidationError("You cannot submit a testimonial for your own product.");
      }

      const existingRows = await tx
        .select({ id: testimonials.id })
        .from(testimonials)
        .where(and(eq(testimonials.productId, product.id), eq(testimonials.authorId, user.id)))
        .limit(1);
      if (existingRows[0]) {
        throw new ValidationError("You have already submitted a testimonial for this product.");
      }

      const testimonialId = crypto.randomUUID();
      await tx.insert(testimonials).values({
        id: testimonialId,
        productId: product.id,
        authorId: user.id,
        content,
        rating,
        sourceType,
        status: "pending",
        identitySnapshot: JSON.stringify(snapshot),
        consentAt: new Date(),
        submittedAt: new Date(),
      });

      if (sourceType === "exchange") {
        await awardReviewCredits(tx, user.id, testimonialId);

        const openRequestRows = await tx
          .select({ id: testimonialRequests.id })
          .from(testimonialRequests)
          .where(
            and(
              eq(testimonialRequests.productId, product.id),
              eq(testimonialRequests.status, "open"),
            ),
          )
          .orderBy(asc(testimonialRequests.createdAt))
          .limit(1);
        const openRequest = openRequestRows[0];
        if (openRequest) {
          await tx
            .update(testimonialRequests)
            .set({ status: "fulfilled", fulfilledTestimonialId: testimonialId })
            .where(eq(testimonialRequests.id, openRequest.id));
        }
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    if (isUniqueViolation(error)) {
      return { error: "You have already submitted a testimonial for this product." };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credits");
  revalidatePath("/explore");
  revalidatePath(`/wall/${slug}`);
  redirect(`${returnTo}?submitted=1`);
}

export async function submitCustomerTestimonial(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return submitTestimonial(formData, "customer");
}

export async function submitExchangeTestimonial(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return submitTestimonial(formData, "exchange");
}

async function ownedTestimonial(userId: string, testimonialId: string) {
  const rows = await db
    .select({ product: products, testimonial: testimonials })
    .from(testimonials)
    .innerJoin(products, eq(products.id, testimonials.productId))
    .where(and(eq(testimonials.id, testimonialId), eq(products.ownerId, userId)))
    .limit(1);
  if (!rows[0]) throw new Error("Testimonial not found.");
  return rows[0];
}

export async function moderateTestimonial(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/inbox");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const tab = String(formData.get("tab") ?? "pending");

  const { product, testimonial } = await ownedTestimonial(user.id, id);
  if (decision === "approve") {
    // A withdrawn testimonial stays withdrawn even if an owner replays an old form.
    if (testimonial.status === "withdrawn") redirect(`/dashboard/inbox?tab=${tab}`);
    const maxRows = await db
      .select({ value: sql<number>`coalesce(max(${testimonials.displayOrder}), -1)` })
      .from(testimonials)
      .where(and(eq(testimonials.productId, product.id), eq(testimonials.status, "approved")));
    await db
      .update(testimonials)
      .set({
        status: "approved",
        approvedAt: new Date(),
        rejectedAt: null,
        displayOrder: Number(maxRows[0]?.value ?? -1) + 1,
      })
      .where(eq(testimonials.id, id));
  } else if (decision === "reject") {
    await db
      .update(testimonials)
      .set({ status: "rejected", rejectedAt: new Date(), approvedAt: null })
      .where(eq(testimonials.id, id));
  } else {
    throw new Error("Unknown moderation decision.");
  }

  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard");
  revalidatePath(`/wall/${product.slug}`);
  redirect(`/dashboard/inbox?tab=${tab}`);
}

export async function withdrawTestimonial(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard");
  const id = String(formData.get("id") ?? "");

  const rows = await db
    .select({ testimonial: testimonials, product: products })
    .from(testimonials)
    .innerJoin(products, eq(products.id, testimonials.productId))
    .where(and(eq(testimonials.id, id), eq(testimonials.authorId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Testimonial not found.");

  if (row.testimonial.status !== "withdrawn") {
    await db
      .update(testimonials)
      .set({
        status: "withdrawn",
        withdrawnAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        displayOrder: 0,
      })
      .where(eq(testimonials.id, id));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/wall");
  revalidatePath("/explore");
  revalidatePath(`/product/${row.product.slug}`);
  revalidatePath(`/wall/${row.product.slug}`);
  redirect(`/product/${row.product.slug}?withdrawn=1`);
}

export async function reorderTestimonial(formData: FormData): Promise<void> {
  const user = await requireUser("/dashboard/wall");
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const { product } = await ownedTestimonial(user.id, id);

  await db.transaction(async (tx) => {
    const items = await tx
      .select({ id: testimonials.id, displayOrder: testimonials.displayOrder })
      .from(testimonials)
      .where(and(eq(testimonials.productId, product.id), eq(testimonials.status, "approved")))
      .orderBy(asc(testimonials.displayOrder), asc(testimonials.submittedAt));

    const index = items.findIndex((item) => item.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    for (let position = 0; position < reordered.length; position += 1) {
      const item = reordered[position];
      await tx
        .update(testimonials)
        .set({ displayOrder: position })
        .where(eq(testimonials.id, item.id));
    }
  });

  revalidatePath("/dashboard/wall");
  revalidatePath(`/wall/${product.slug}`);
  redirect("/dashboard/wall");
}
