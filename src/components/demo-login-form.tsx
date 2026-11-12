"use client";

import { useActionState } from "react";
import { demoSignIn } from "@/app/actions/auth";
import type { FormState } from "@/lib/action-state";

export function DemoLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    demoSignIn,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">Full name</span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Ada Lovelace"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="ada@example.com"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">
          Headline <span className="font-normal text-zinc-400">(optional, self-reported)</span>
        </span>
        <input
          name="headline"
          maxLength={120}
          placeholder="Founder at Acme"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Continue with demo identity"}
      </button>
      <p className="text-[11px] leading-relaxed text-zinc-400">
        Demo sign-in creates a local account for testing. It is not LinkedIn identity
        verification and should be disabled before a public launch.
      </p>
    </form>
  );
}
