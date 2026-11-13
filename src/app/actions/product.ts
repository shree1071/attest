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

    const existing = db
      .select()
      .from(products)
      .where(eq(products.ownerId, user.id))
      .get();

    const clash = db.select().from(products).where(eq(products.slug, slug)).get();
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
      db.update(products).set(values).where(eq(products.id, existing.id)).run();
    } else {
      db.insert(products)
        .values({ id: crypto.randomUUID(), ownerId: user.id, ...values })
        .run();
    }
    publishedSlug = slug;
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: products.slug")) {
      return { error: "That public URL was just taken. Pick another slug." };
    }
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: products.owner_id")) {
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
