import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { balanceOf } from "@/lib/credits";
import { Avatar } from "./avatar";
import { Wordmark } from "./brand";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const balance = user ? balanceOf(user.id) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Wordmark href={user ? "/dashboard" : "/"} />

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/explore"
            className="rounded-lg px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            Marketplace
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/credits"
                className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 sm:flex"
                title="Available credits"
              >
                <span className="size-1.5 rounded-full bg-indigo-500" />
                {balance} credits
              </Link>
              <div className="ml-1 flex items-center gap-2 border-l border-zinc-200 pl-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2"
                  title={`Signed in with ${user.identitySource === "linkedin" ? "LinkedIn" : "demo auth"}`}
                >
                  <Avatar name={user.name} src={user.avatarUrl} size={28} />
                  <span className="hidden max-w-28 truncate text-xs font-medium text-zinc-700 md:block">
                    {user.name}
                  </span>
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-zinc-900 px-3.5 py-1.5 font-medium text-white transition hover:bg-zinc-800"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <p>
          Collecting your own customers’ testimonials is free forever. Identity is captured at
          submission and never re-fetched.
        </p>
      </div>
    </footer>
  );
}
