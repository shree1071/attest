"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveProduct } from "@/app/actions/product";
import { CATEGORIES } from "@/lib/constants";
import type { FormState } from "@/lib/action-state";

export type ProductFormValues = {
  name: string;
  description: string;
  websiteUrl: string;
  category: string;
  slug: string;
  logoUrl: string | null;
  isPublic: boolean;
  acceptingTestimonials: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

export function ProductForm({ initial }: { initial: ProductFormValues | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveProduct,
    undefined,
  );
  const [preview, setPreview] = useState<string | null>(initial?.logoUrl ?? null);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-600">Product name</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={initial?.name}
            placeholder="Pulseboard"
            className={fieldClass}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-600">Category</span>
          <select name="category" defaultValue={initial?.category ?? "SaaS"} className={fieldClass}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">Short description</span>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={600}
          rows={3}
          defaultValue={initial?.description}
          placeholder="What it does, who it is for, and what makes it useful."
          className={`${fieldClass} resize-y`}
        />
        <span className="text-[11px] text-zinc-400">20–600 characters. Shown on your public page.</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-600">Website URL</span>
          <input
            name="websiteUrl"
            type="url"
            required
            defaultValue={initial?.websiteUrl}
            placeholder="https://pulseboard.app"
            className={fieldClass}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-600">Public slug</span>
          <div className="flex items-center gap-0">
            <span className="rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-500">
              /wall/
            </span>
            <input
              name="slug"
              maxLength={48}
              defaultValue={initial?.slug}
              placeholder="pulseboard"
              pattern="[a-z0-9-]*"
              className={`${fieldClass} rounded-l-none`}
            />
          </div>
          <span className="text-[11px] text-zinc-400">
            Lowercase letters, numbers and dashes. Leave blank to derive from the name.
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Logo preview"
                className="size-12 rounded-xl border border-zinc-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-xl border border-dashed border-zinc-300 bg-white text-[10px] text-zinc-400">
                Logo
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-zinc-800">Product logo</p>
              <p className="text-[11px] text-zinc-500">PNG, JPEG or WebP. 512 KB max.</p>
            </div>
          </div>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && file.size > 512 * 1024) {
                setFileError(
                  `Selected image is ${(file.size / 1024).toFixed(0)} KB. Logo must be 512 KB or smaller.`
                );
              } else {
                setFileError(null);
              }
              setPreview(file ? URL.createObjectURL(file) : (initial?.logoUrl ?? null));
            }}
            className="max-w-[190px] text-xs text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 file:ring-1 file:ring-zinc-300"
          />
        </div>
        {fileError ? (
          <p className="mt-2 text-xs font-medium text-red-600">{fileError}</p>
        ) : null}
        {initial?.logoUrl ? (
          <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
            <input type="checkbox" name="removeLogo" className="size-3.5 rounded border-zinc-300" />
            Remove current logo
          </label>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={initial?.isPublic ?? true}
            className="mt-0.5 size-4 rounded border-zinc-300"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-800">Listed in the marketplace</span>
            <span className="block text-[11px] text-zinc-500">
              Other founders can discover your product and write a testimonial.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
          <input
            type="checkbox"
            name="acceptingTestimonials"
            defaultChecked={initial?.acceptingTestimonials ?? true}
            className="mt-0.5 size-4 rounded border-zinc-300"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-800">Accepting testimonials</span>
            <span className="block text-[11px] text-zinc-500">
              Turn this off to keep your page live but pause new submissions.
            </span>
          </span>
        </label>
      </div>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || Boolean(fileError)}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : initial ? "Save product" : "Create product"}
      </button>
    </form>
  );
}
