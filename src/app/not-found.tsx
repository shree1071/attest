import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
          This page is not available
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          The product may have been removed, renamed, or set to unlisted by its owner.
        </p>
        <Link
          href="/explore"
          className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Browse the marketplace
        </Link>
      </main>
    </div>
  );
}
