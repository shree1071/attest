"use client";

import { useActionState, useState } from "react";
import {
  submitCustomerTestimonial,
  submitExchangeTestimonial,
} from "@/app/actions/testimonials";
import { Avatar } from "@/components/avatar";
import type { FormState } from "@/lib/action-state";
import { formatDate } from "@/lib/format";

const MIN = 100;
const MAX = 5000;

export function TestimonialForm({
  slug,
  source,
  author,
}: {
  slug: string;
  source: "customer" | "exchange";
  author: {
    name: string;
    avatarUrl: string | null;
    identitySource: "demo" | "linkedin";
    observedAt: Date | null;
  };
}) {
  const action = source === "exchange" ? submitExchangeTestimonial : submitCustomerTestimonial;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  const [length, setLength] = useState(0);
  const [rating, setRating] = useState(5);
  const tooShort = length < MIN;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
        <Avatar name={author.name} src={author.avatarUrl} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">{author.name}</p>
          <p className="text-[11px] text-zinc-500">
            {author.identitySource === "linkedin"
              ? "Signed in with LinkedIn"
              : "Local demo identity"}
            {author.observedAt ? ` · observed ${formatDate(author.observedAt)}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
          Snapshot on submit
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-zinc-600">Rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-0.5 transition hover:scale-110 focus:outline-none"
              title={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <svg
                className={`size-6 ${
                  star <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-zinc-200 text-zinc-200"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-xs font-medium text-zinc-600">{rating} out of 5 stars</span>
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">Your testimonial</span>
        <textarea
          name="content"
          required
          minLength={MIN}
          maxLength={MAX}
          rows={6}
          onInput={(event) => setLength(event.currentTarget.value.trim().length)}
          placeholder="What problem did this product solve for you? Be specific about the outcome."
          className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="flex justify-between text-[11px]">
          <span className={tooShort ? "text-zinc-400" : "text-emerald-600"}>
            {tooShort ? `${MIN - length} more characters needed` : "Length looks good"}
          </span>
          <span className="text-zinc-400">
            {length}/{MAX}
          </span>
        </div>
      </label>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-600">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-3.5 rounded border-zinc-300"
        />
        <span>
          I allow this testimonial to be published with my name and the identity details above.
          The product owner chooses what appears publicly.
        </span>
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-400">
          {source === "exchange"
            ? "Pending moderation · you earn 5 credits"
            : "Private collection link · no credits involved"}
        </p>
        <button
          type="submit"
          disabled={pending || tooShort}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit testimonial"}
        </button>
      </div>
    </form>
  );
}
