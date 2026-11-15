import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Collect from your customers",
    body: "Share your collection link. Every testimonial you collect directly is free, forever — no credits, no limits.",
  },
  {
    title: "Trade one for five",
    body: "Review another founder’s product from the marketplace and earn 5 credits. Spend 1 credit to request a testimonial back.",
  },
  {
    title: "Publish what you choose",
    body: "Approve, reject and reorder on your dashboard, then embed the wall on your site with one iframe.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Free forever for your own customers
            </span>
            <h1 className="mt-6 text-balance text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl">
              Give one testimonial.
              <br />
              <span className="text-zinc-400">Get five back.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600">
              Attest is a testimonial platform for founders who are early. Collect real
              testimonials from your customers for free, exchange reviews with other builders,
              and publish a wall you control.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Start collecting free
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                Browse the marketplace
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              No credit card. No video. Just text testimonials with identities attached.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-100/70 via-zinc-100 to-emerald-50 blur-2xl" />
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Your exchange balance</p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200">
                  Ledger
                </span>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
                4<span className="ml-1 text-base font-normal text-zinc-400">credits</span>
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-800">Testimonial submitted</p>
                    <p className="text-[11px] text-zinc-500">Community exchange</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">+5</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-zinc-800">Testimonial requested</p>
                    <p className="text-[11px] text-zinc-500">Forwarded to reviewers</p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-500">−1</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4 text-center">
                {["Signed in", "Snapshot taken", "Owner approves"].map((label, index) => (
                  <div key={label}>
                    <div className="mx-auto grid size-8 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-tight text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200">
                  Method 1 · Free
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">
                  Your own customers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Send your collection link to people who already use your product. They sign
                  in, write a testimonial, and it lands in your inbox. No credits are deducted
                  or required — ever.
                </p>
                <code className="mt-4 block rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[11px] text-zinc-500">
                  attest.app/collect/your-product
                </code>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200">
                  Method 2 · Exchange
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">
                  The founder marketplace
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Review another founder’s product and earn 5 credits. Spend 1 credit to put
                  your own product in front of reviewers. Every submission is one testimonial
                  per founder per product — no farming.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-indigo-700">
                  <span className="rounded-md bg-white px-2 py-1 ring-1 ring-indigo-200">
                    1 review
                  </span>
                  <span>→</span>
                  <span className="rounded-md bg-white px-2 py-1 ring-1 ring-indigo-200">
                    +5 credits
                  </span>
                  <span>→</span>
                  <span className="rounded-md bg-white px-2 py-1 ring-1 ring-indigo-200">
                    1 request
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Three steps, no busywork
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <span className="grid size-7 place-items-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Identity captured once, kept intact
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Reviewers sign in with LinkedIn at submission. Attest stores a local snapshot
                of the identity that was presented — display name, picture, and any headline
                the reviewer chose to provide, with the time it was observed. The public wall
                reads that snapshot, so testimonials do not break if an account later changes
                or disappears.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                LinkedIn sign-in is an authentication check, not LinkedIn verification or
                endorsement. OIDC does not guarantee a headline or public profile URL, so those
                are either omitted or labelled as self-reported.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Snapshot record
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Display name", "Ada Lovelace"],
                  ["Identity source", "LinkedIn sign-in"],
                  ["Observed", "13 Nov 2026, 09:41"],
                  ["Headline", "Founder at Analytical Engines"],
                  ["Snapshot version", "1"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-zinc-200/70 pb-2 last:border-0 last:pb-0">
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="font-medium text-zinc-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 rounded-2xl border border-zinc-200 bg-white p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Embed in one line
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Every wall is a responsive page. Drop an iframe anywhere on your site, or link
                to it directly. Approved testimonials only — pending and rejected entries never
                appear.
              </p>
              <Link
                href="/explore"
                className="mt-5 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Browse products →
              </Link>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
{`<iframe
  src="https://your-app/wall/your-product?embed=1"
  title="Your customers' testimonials"
  width="100%"
  height="640"
  style="border:0;border-radius:12px"
  loading="lazy"
></iframe>`}
            </pre>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-zinc-900 px-8 py-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Start with the customers you already have.
              </h2>
              <p className="mt-1.5 text-sm text-zinc-400">
                Free collection, a credit ledger that is enforced on the server, and a wall you
                control.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Create your product
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
