"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession, demoAuthEnabled, destroySession, safeNextPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { users } from "@/lib/schema";
import { email, optionalText, text } from "@/lib/validate";
import type { FormState } from "@/lib/action-state";

export async function demoSignIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!demoAuthEnabled()) {
    return { error: "Demo sign-in is disabled on this deployment." };
  }

  let userId: string;
  try {
    const address = email(formData.get("email"));
    const name = text(formData.get("name"), { label: "Your name", min: 2, max: 80 });
    const headline = optionalText(formData.get("headline"), 120);

    const existingRows = await db.select().from(users).where(eq(users.email, address)).limit(1);
    const existing = existingRows[0];
    if (existing && existing.identitySource !== "demo") {
      return { error: "This address belongs to a LinkedIn account. Sign in with LinkedIn instead." };
    }
    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          identityObservedAt: new Date(),
          name,
          ...(headline ? { headline, headlineSource: "self_reported" as const } : {}),
        })
        .where(eq(users.id, existing.id));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: address,
        name,
        headline,
        headlineSource: "self_reported",
        identitySource: "demo",
        identityObservedAt: new Date(),
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    throw error;
  }

  await createSession(userId);
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
