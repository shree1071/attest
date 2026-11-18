import Link from "next/link";
import { TestimonialCard } from "@/components/testimonial-card";
import { Avatar } from "@/components/avatar";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { parseSnapshot } from "@/lib/identity";
import {
  exploreProducts,
  publicWallStats,
  recentPublicTestimonials,
  type PublicTestimonialRow,
} from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

const ACCENT = "#4f46e5";

const steps = [
  {
    title: "Collect from your customers",
    body: "Share your collection link. They sign in, write a testimonial, and it lands in your inbox. Every one you collect directly is free, forever.",
  },
  {
    title: "Trade one for five",
    body: "Review another founder’s product from the marketplace and earn 5 credits. Spend 1 credit to put your product in front of reviewers.",
  },
  {
    title: "Publish what you choose",
    body: "Approve, reject and reorder from the dashboard, then drop the wall on your site with one line of HTML.",
  },
];

const highlights = [
  {
    title: "Approved by you",
    body: "Pending and rejected entries never render. Nothing is auto-published.",
    icon: (
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    ),
  },
  {
    title: "Identity snapshots",
    body: "Name, avatar and headline are captured once, at submission time.",
    icon: (
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    ),
  },
  {
    title: "One-line embed",
    body: "Wall, grid, carousel, badge or floating bubble — your colours, your layout.",
    icon: (
      <path
        fillRule="evenodd"
        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    ),
  },
  {
    title: "No credit card",
    body: "Collecting direct customer testimonials costs nothing. Ever.",
    icon: (
      <path d="M3 5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H3zm0 2h14v2H3V7zm0 4h6v2H3v-2z" />
    ),
  },
];

function BrandChip({
  name,
  logo,
  subtitle,
}: {
  name: string;
  logo: string | null;
  subtitle?: string;
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.55)] ring-1 ring-black/5">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          className="size-7 rounded-full border border-zinc-200 bg-white object-contain p-0.5"
        />
      ) : (
        <span
          className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{
            backgroundImage: `linear-gradient(140deg, ${ACCENT}, color-mix(in oklab, ${ACCENT} 70%, #000))`,
          }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block max-w-36 truncate text-xs font-semibold text-zinc-900">{name}</span>
        {subtitle ? <span className="block text-[10px] text-zinc-500">{subtitle}</span> : null}
      </span>
    </div>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          style={{ width: size, height: size }}
          className={
            index < Math.round(rating) ? "fill-amber-400" : "fill-zinc-200"
          }
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function WallPreview({ rows }: { rows: PublicTestimonialRow[] }) {
  const lead = rows[0];
  const extra = rows[1];
  const avg =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.testimonial.rating ?? 5), 0) / rows.length
      : 5;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_30%_20%,rgba(79,70,229,0.18),transparent_70%),radial-gradient(50%_50%_at_80%_80%,rgba(16,185,129,0.16),transparent_70%)] blur-2xl"
      />

      <div className="rounded-[34px] bg-white/45 p-2.5 ring-1 ring-white/70 shadow-[0_40px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <div className="rounded-[28px] bg-[#eef1f5]/90 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <BrandChip
              name={lead?.productName ?? "Your product"}
              logo={lead ? logoUrl(lead.productLogoKey) : null}
              subtitle={lead ? "Wall of love" : "Preview"}
            />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] ring-1 ring-black/5">
              <StarRow rating={avg} size={12} />
              {avg.toFixed(1)}
              <span className="font-normal text-zinc-400">({rows.length})</span>
            </span>
          </div>

          <div className="mt-3.5">
            {lead ? (
              <TestimonialCard
                content={lead.testimonial.content}
                snapshot={parseSnapshot(lead.testimonial.identitySnapshot)}
                sourceType={lead.testimonial.sourceType}
                submittedAt={lead.testimonial.submittedAt}
                rating={lead.testimonial.rating ?? 5}
                variant="wall"
                accent={ACCENT}
              />
            ) : (
              <figure className="flex h-full flex-col rounded-[26px] bg-white p-6 ring-1 ring-black/[0.04] shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)]">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Example card
                </span>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-zinc-600">
                  “Your first approved testimonial appears here, with the reviewer’s name,
                  headline and sign-in badge attached.”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    A
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Ada Lovelace</p>
                    <p className="text-xs text-zinc-500">Founder at Analytical Engines</p>
                  </div>
                </div>
              </figure>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-zinc-500 ring-1 ring-black/5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Embedded with Attest
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
              style={{ background: ACCENT }}
            >
              Leave a testimonial
            </span>
          </div>
        </div>
      </div>

      {extra ? (
        <div className="absolute -bottom-7 right-4 hidden w-60 rotate-[3deg] rounded-3xl bg-white p-4 shadow-[0_26px_50px_-26px_rgba(15,23,42,0.5)] ring-1 ring-black/[0.05] xl:block">
          <StarRow rating={extra.testimonial.rating ?? 5} size={12} />
          <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-zinc-600">
            “{extra.testimonial.content}”
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Avatar
              name={parseSnapshot(extra.testimonial.identitySnapshot).display_name}
              src={parseSnapshot(extra.testimonial.identitySnapshot).avatar_url}
              size={24}
              accent={ACCENT}
            />
            <span className="truncate text-[11px] font-semibold text-zinc-800">
              {parseSnapshot(extra.testimonial.identitySnapshot).display_name}
            </span>
          </div>
        </div>
      ) : null}

      <div className="absolute -left-5 top-20 hidden rotate-[-6deg] rounded-2xl bg-white px-3 py-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.5)] ring-1 ring-black/5 lg:block">
        <p className="text-[10px] font-medium text-zinc-500">Testimonial earned</p>
        <p className="text-sm font-semibold text-emerald-600">+5 credits</p>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const preview = await recentPublicTestimonials(3);
  const stats = await publicWallStats();
  const marketplace = (await exploreProducts(null, "", null)).slice(0, 3);
  const embedProduct = preview[0];

  const reviewers = preview
    .map((row) => parseSnapshot(row.testimonial.identitySnapshot))
    .filter((snapshot) => snapshot.display_name)
    .slice(0, 3);

  const average =
    preview.length > 0
      ? preview.reduce((sum, row) => sum + (row.testimonial.rating ?? 5), 0) / preview.length
      : 5;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5f7]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[-220px] h-[620px] bg-[radial-gradient(45%_55%_at_20%_50%,rgba(79,70,229,0.14),transparent_70%),radial-gradient(40%_50%_at_85%_30%,rgba(16,185,129,0.12),transparent_70%)]"
          />

          <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-[0_10px_30px_-24px_rgba(16,185,129,0.8)]">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Free forever for your own customers
              </span>

              <h1 className="mt-6 text-balance text-[2.85rem] font-semibold leading-[1.02] tracking-[-0.03em] text-zinc-900 sm:text-[4.15rem]">
                Give one testimonial.
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                  Get five back.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-zinc-600">
                Attest is a testimonial platform for founders who are early. Collect real
                testimonials from your customers for free, trade reviews with other builders,
                and publish a wall you control — with the identity of every reviewer attached.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
                >
                  Start collecting free
                  <span className="transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:text-zinc-950"
                >
                  Browse the marketplace
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                {reviewers.length > 0 ? (
                  <div className="flex -space-x-2">
                    {reviewers.map((snapshot, index) => (
                      <span key={index} className="inline-block rounded-full ring-2 ring-[#f4f5f7]">
                        <Avatar
                          name={snapshot.display_name}
                          src={snapshot.avatar_url}
                          size={30}
                          accent={ACCENT}
                        />
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="text-xs text-zinc-500">
                  {stats.approved > 0 ? (
                    <>
                      <span className="font-semibold text-zinc-800">
                        {stats.approved} approved {stats.approved === 1 ? "testimonial" : "testimonials"}
                      </span>{" "}
                      on {stats.walls} public {stats.walls === 1 ? "wall" : "walls"} ·{" "}
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                        <StarRow rating={average} size={12} />
                        {average.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    "No credit card. No video. Just text testimonials with identities attached."
                  )}
                </div>
              </div>
            </div>

            <WallPreview rows={preview} />
          </div>
        </section>

        {/* Highlight strip */}
        <section className="mx-auto max-w-6xl px-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/80 p-5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.6)] ring-1 ring-white/70 backdrop-blur-sm"
              >
                <span className="inline-grid size-9 place-items-center rounded-xl bg-zinc-900 text-white">
                  <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden>
                    {item.icon}
                  </svg>
                </span>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two ways to fill the wall */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Two ways in
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-[2.4rem] sm:leading-tight">
              Collect from your customers. Or trade with founders.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Direct collection is free and unlimited. The marketplace exists so early products
              without an audience can still build a wall worth showing.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[28px] bg-white p-7 shadow-[0_30px_60px_-48px_rgba(15,23,42,0.6)] ring-1 ring-black/[0.04]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-emerald-100/70 blur-2xl"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                  Free · unlimited
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">
                  Your own customers
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Send your collection link to people who already use your product. They sign
                  in, write a testimonial, and it lands in your inbox. No credits required —
                  ever.
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200/70">
                  <svg viewBox="0 0 20 20" className="size-4 shrink-0 fill-zinc-400" aria-hidden>
                    <path d="M12.586 2.586a2 2 0 00-2.828 0l-7 7a2 2 0 00-.586 1.414V15a2 2 0 002 2h3.586a2 2 0 001.414-.586l7-7a2 2 0 000-2.828l-3.586-3.586zM9.879 4l6 6-7 7H5v-3.879l4.879-4.879z" />
                  </svg>
                  <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-600">
                    attest.app/collect/your-product
                  </code>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                    live
                  </span>
                </div>

                <ul className="mt-5 space-y-2 text-xs text-zinc-600">
                  {["One testimonial per reviewer per product", "Approve before anything goes live", "LinkedIn sign-in captured at submit"].map(
                    (line) => (
                      <li key={line} className="flex items-start gap-2">
                        <svg viewBox="0 0 20 20" className="mt-0.5 size-3.5 shrink-0 fill-emerald-500" aria-hidden>
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {line}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] bg-white p-7 shadow-[0_30px_60px_-48px_rgba(15,23,42,0.6)] ring-1 ring-black/[0.04]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-indigo-100/70 blur-2xl"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200/80">
                  Exchange · 5 credits per review
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">
                  The founder marketplace
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Review another founder’s product and earn 5 credits. Spend 1 credit to put
                  your own product in front of reviewers. Server-enforced ledger, no overdrafts.
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-indigo-700">
                  <span className="rounded-md bg-indigo-50 px-2 py-1 ring-1 ring-indigo-200">1 review</span>
                  <span aria-hidden>→</span>
                  <span className="rounded-md bg-indigo-50 px-2 py-1 ring-1 ring-indigo-200">+5 credits</span>
                  <span aria-hidden>→</span>
                  <span className="rounded-md bg-indigo-50 px-2 py-1 ring-1 ring-indigo-200">1 request</span>
                </div>

                <div className="mt-5 space-y-1.5">
                  {marketplace.length > 0 ? (
                    marketplace.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2.5 rounded-xl bg-zinc-50/80 px-3 py-2 ring-1 ring-zinc-200/60"
                      >
                        <span className="grid size-7 place-items-center rounded-lg bg-zinc-900 text-[11px] font-semibold text-white">
                          {item.product.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-800">
                            {item.product.name}
                          </p>
                          <p className="truncate text-[10px] text-zinc-500">
                            {item.product.category} · {item.approvedCount} approved
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.openRequests > 0
                              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {item.openRequests > 0 ? `${item.openRequests} open` : "closed"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-zinc-50/80 px-3 py-3 text-[11px] leading-relaxed text-zinc-500 ring-1 ring-zinc-200/60">
                      No open requests yet. Be first — review a product and open a request for
                      your own.
                    </p>
                  )}
                  <Link
                    href="/explore"
                    className="mt-1 inline-flex text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Browse the marketplace →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-3xl">
              Three steps, no busywork
            </h2>
            <p className="text-xs text-zinc-500">From link to live wall in an afternoon.</p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group relative rounded-[26px] bg-white p-6 shadow-[0_24px_50px_-44px_rgba(15,23,42,0.6)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Step {index + 1} of 3
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p>
                <span
                  aria-hidden
                  className="mt-5 block h-1 w-10 rounded-full bg-zinc-100 transition group-hover:w-16"
                  style={{ background: index === 0 ? "#10b981" : index === 1 ? ACCENT : "#18181b" }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Embed */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="grid gap-6 rounded-[30px] bg-white p-6 shadow-[0_35px_70px_-55px_rgba(15,23,42,0.65)] ring-1 ring-black/[0.04] sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Embed
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-3xl">
                One line, any layout.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Every wall is a responsive page. Drop an iframe anywhere, or use the script for
                a no-iframe embed. Only approved testimonials ever render.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Wall", "Grid", "Carousel", "Badge", "Floating"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <pre className="mt-5 overflow-x-auto rounded-2xl bg-zinc-900 p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
{`<iframe
  src="https://attest.app/wall/${embedProduct?.productSlug ?? "your-product"}?embed=1&layout=carousel&limit=4"
  title="Your customers' testimonials"
  width="100%"
  height="640"
  style="border:0;border-radius:24px"
  loading="lazy"
></iframe>`}
              </pre>

              <Link
                href="/explore"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                See a live wall →
              </Link>
            </div>

            <div className="overflow-hidden rounded-[24px] bg-[#eef1f5] ring-1 ring-black/[0.06]">
              <div className="flex items-center gap-2 border-b border-white/70 bg-white/70 px-3 py-2">
                <span className="flex gap-1">
                  <span className="size-2 rounded-full bg-zinc-300" />
                  <span className="size-2 rounded-full bg-zinc-300" />
                  <span className="size-2 rounded-full bg-zinc-300" />
                </span>
                <span className="min-w-0 flex-1 truncate rounded-full bg-white px-3 py-1 text-center font-mono text-[10px] text-zinc-500 ring-1 ring-zinc-200">
                  {embedProduct
                    ? `/wall/${embedProduct.productSlug}?embed=1&layout=carousel`
                    : "/wall/your-product?embed=1&layout=carousel"}
                </span>
              </div>
              {embedProduct ? (
                <iframe
                  src={`${paths.wall(embedProduct.productSlug)}?embed=1&layout=carousel&limit=4`}
                  title={`${embedProduct.productName} embedded wall preview`}
                  className="h-[500px] w-full"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-[500px] place-items-center px-6 text-center">
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Publish your first testimonial and its wall will preview right here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Identity */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-[30px] bg-zinc-900 p-7 text-zinc-100 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.8)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Identity
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  Captured once, kept intact.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Reviewers sign in with LinkedIn at submission. Attest stores a local snapshot
                  of the identity presented — name, picture, and any self-reported headline,
                  with the time it was observed. The wall reads that snapshot, so testimonials
                  don’t break when an account changes later.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  LinkedIn sign-in is an authentication check, not LinkedIn verification or
                  endorsement. OIDC does not guarantee a headline or public profile URL, so those
                  are omitted or labelled self-reported.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-950/60 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Snapshot record
                  </span>
                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                    schema v1
                  </span>
                </div>
                <dl className="mt-3 space-y-2 text-xs">
                  {[
                    ["Display name", "Ada Lovelace"],
                    ["Identity source", "LinkedIn sign-in"],
                    ["Observed", "13 Nov 2026, 09:41"],
                    ["Headline", "Founder at Analytical Engines"],
                    ["Profile URL", "linkedin.com/in/ada"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="text-zinc-500">{label}</dt>
                      <dd className="truncate font-medium text-zinc-200">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-white/5 pt-3 font-mono text-[10px] leading-relaxed text-zinc-500">
                  identity_snapshot stored at submit · never re-fetched
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-[32px] bg-white px-7 py-10 shadow-[0_40px_80px_-55px_rgba(15,23,42,0.6)] ring-1 ring-black/[0.04] sm:px-10 sm:py-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-indigo-100/70 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-emerald-100/70 blur-3xl"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-[1.9rem]">
                  Start with the customers you already have.
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Free collection, a server-enforced credit ledger, and a wall you control.
                  {stats.approved > 0
                    ? ` ${stats.approved} testimonials published so far.`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
                >
                  Create your product
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-700 ring-1 ring-black/5 transition hover:text-zinc-900"
                >
                  Explore walls
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
