"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditEvents, testimonials, users } from "@/lib/schema";

export async function adminModerateTestimonial(formData: FormData) {
  const admin = await requireAdmin();
  const testimonialId = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? ""); // "approved" | "rejected" | "withdrawn"
  const reason = String(formData.get("reason") ?? "Admin moderation action");

  if (!["approved", "rejected", "withdrawn"].includes(action)) return;

  const currentRows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, testimonialId))
    .limit(1);
  if (!currentRows[0]) return;

  await db.transaction(async (tx) => {
    await tx
      .update(testimonials)
      .set({
        status: action as "approved" | "rejected" | "withdrawn",
        ...(action === "approved" ? { approvedAt: new Date() } : {}),
        ...(action === "rejected" ? { rejectedAt: new Date() } : {}),
        ...(action === "withdrawn" ? { withdrawnAt: new Date() } : {}),
      })
      .where(eq(testimonials.id, testimonialId));

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: `testimonial_${action}`,
      targetType: "testimonial",
      targetId: testimonialId,
      reason,
      createdAt: new Date(),
    });
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard/wall");
}

export async function adminToggleUserRestriction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "Account restriction update");

  const targetRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const target = targetRows[0];
  if (!target) return;

  const nextState = !target.isRestricted;

  await db.transaction(async (tx) => {
    await tx.update(users).set({ isRestricted: nextState }).where(eq(users.id, userId));

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: nextState ? "restrict_user" : "unrestrict_user",
      targetType: "user",
      targetId: userId,
      reason,
      createdAt: new Date(),
    });
  });

  revalidatePath("/admin");
}
