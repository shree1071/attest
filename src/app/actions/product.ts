"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isCategory } from "@/lib/constants";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { products } from "@/lib/schema";
import { saveLogo } from "@/lib/uploads";
import { checkbox, httpUrl, optionalText, slugify, text } from "@/lib/validate";
import type { FormState } from "@/lib/action-state";

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pgError = error as { code?: string; constraint?: string };
  return pgError?.code === "23505" && pgError.constraint === constraint;
}

export async function saveProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/dashboard/product");
  let publishedSlug = "";

  try {
    const name = text(formData.get("name"), { label: "Product name", min: 2, max: 60 });
    const description = text(formData.get("description"), {
      label: "Description",
      min: 20,
      max: 600,
    });
    const websiteUrl = httpUrl(formData.get("websiteUrl"), "Website URL");
    const category = formData.get("category");
    const slugInput = optionalText(formData.get("slug"), 48);
    const slug = slugify(slugInput ?? name);
    if (slug.length < 2) {
      throw new ValidationError("Choose a longer product name or enter a custom slug.");
    }

    const existingRows = await db
      .select()
      .from(products)
      .where(eq(products.ownerId, user.id))
      .limit(1);
    const existing = existingRows[0];

    const clashRows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    const clash = clashRows[0];
    if (clash && clash.id !== existing?.id) {
      throw new ValidationError("That public URL is already taken. Pick another slug.");
    }

    let logoKey = existing?.logoKey ?? null;
    if (checkbox(formData.get("removeLogo"))) logoKey = null;
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      logoKey = await saveLogo(file);
    }

    const values = {
      name,
      description,
      websiteUrl,
      category: isCategory(category) ? category : "Other",
      slug,
      logoKey,
      isPublic: checkbox(formData.get("isPublic")),
      acceptingTestimonials: checkbox(formData.get("acceptingTestimonials")),
    };

    if (existing) {
      await db.update(products).set(values).where(eq(products.id, existing.id));
    } else {
      await db.insert(products).values({ id: crypto.randomUUID(), ownerId: user.id, ...values });
    }
    publishedSlug = slug;
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    if (isUniqueViolation(error, "products_slug_uq")) {
      return { error: "That public URL was just taken. Pick another slug." };
    }
    if (isUniqueViolation(error, "products_owner_uq")) {
      return { error: "You already have a product. Refresh the page and try again." };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/explore");
  revalidatePath(`/product/${publishedSlug}`);
  revalidatePath(`/wall/${publishedSlug}`);
  redirect("/dashboard/product?saved=1");
}
