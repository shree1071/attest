import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoLoginForm } from "@/components/demo-login-form";
import { LogoMark } from "@/components/brand";
import { SiteHeader } from "@/components/site-chrome";
import { demoAuthEnabled, getCurrentUser, safeNextPath } from "@/lib/auth";
import { linkedinConfigured } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  linkedin_unconfigured:
    "LinkedIn sign-in is not configured on this deployment. Use demo sign-in, or add LinkedIn OIDC credentials.",
  linkedin_state: "That LinkedIn sign-in attempt expired or was tampered with. Please try again.",
  linkedin_failed: "LinkedIn sign-in could not be completed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  const demoEnabled = demoAuthEnabled();
  const linkedin = linkedinConfigured();
  const error = params.error ? errors[params.error] ?? "Sign-in failed. Please try again." : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark className="size-11" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Sign in to Attest
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            One account for collecting, exchanging and publishing testimonials.
          </p>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
            {error}
          </p>
        ) : null}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {linkedin ? (
            <a
              href={`/api/auth/linkedin/start?next=${encodeURIComponent(next)}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a66c2] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#0958a8]"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
              </svg>
              Sign in with LinkedIn
            </a>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 text-center text-xs text-zinc-500">
              LinkedIn OIDC is not configured on this deployment. Set{" "}
              <code className="font-mono text-[11px]">LINKEDIN_CLIENT_ID</code> and{" "}
              <code className="font-mono text-[11px]">LINKEDIN_CLIENT_SECRET</code> to enable it.
            </div>
          )}

          {demoEnabled ? (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-200" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Local testing
                </span>
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
              <DemoLoginForm next={next} />
            </>
          ) : null}
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-400">
          By continuing you agree to let Attest store the identity details you present at
          submission time. You can withdraw a testimonial you submitted at any time; it will
          be removed from the public wall.
        </p>

        <p className="mt-3 text-center text-xs text-zinc-500">
          Just browsing?{" "}
          <Link href="/explore" className="font-medium text-zinc-800 underline underline-offset-2">
            Explore products
          </Link>
        </p>
      </main>
    </div>
  );
}
