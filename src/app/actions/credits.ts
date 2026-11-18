"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { chargeForRequest } from "@/lib/credits";
import { db } from "@/lib/db";
import { products, testimonialRequests } from "@/lib/schema";

export async function requestTestimonial(): Promise<void> {
  const user = await requireUser("/dashboard/credits");
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.ownerId, user.id))
    .limit(1);
  const product = productRows[0];

  if (!product) redirect("/dashboard/product");
  if (!product.isPublic) redirect("/dashboard/credits?error=unlisted");
  if (!product.acceptingTestimonials) redirect("/dashboard/credits?error=paused");

  try {
    await db.transaction(async (tx) => {
      const requestId = crypto.randomUUID();
      await chargeForRequest(tx, user.id, requestId);
      await tx.insert(testimonialRequests).values({
        id: requestId,
        productId: product.id,
        status: "open",
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("at least 1 credit")) {
      redirect("/dashboard/credits?error=insufficient");
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/credits");
  revalidatePath("/explore");
  redirect("/dashboard/credits?requested=1");
}
