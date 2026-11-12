"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { chargeForRequest } from "@/lib/credits";
import { db, type Db } from "@/lib/db";
import { products, testimonialRequests } from "@/lib/schema";

export async function requestTestimonial(): Promise<void> {
  const user = await requireUser("/dashboard/credits");
  const product = db
    .select()
    .from(products)
    .where(eq(products.ownerId, user.id))
    .get();

  if (!product) redirect("/dashboard/product");
  if (!product.isPublic) redirect("/dashboard/credits?error=unlisted");
  if (!product.acceptingTestimonials) redirect("/dashboard/credits?error=paused");

  try {
    db.transaction((tx) => {
      const requestId = crypto.randomUUID();
      chargeForRequest(tx as unknown as Db, user.id, requestId);
      tx.insert(testimonialRequests)
        .values({ id: requestId, productId: product.id, status: "open" })
        .run();
    }, { behavior: "immediate" });
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
