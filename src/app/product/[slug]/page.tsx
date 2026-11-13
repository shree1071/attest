import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withdrawTestimonial } from "@/app/actions/testimonials";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TestimonialCard } from "@/components/testimonial-card";
import { TestimonialForm } from "@/components/testimonial-form";
import { getCurrentUser } from "@/lib/auth";
import { parseSnapshot } from "@/lib/identity";
import {
  getProductBySlug,
  listWall,
  openRequests,
  ownerName,
  submissionFor,
} from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || !product.isPublic) return { title: "Product not available — Attest" };
  return {
    title: `${product.name} — Attest`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; withdrawn?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const viewer = await getCurrentUser();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  if (!product.isPublic && viewer?.id !== product.ownerId) notFound();

  const owner = ownerName(product.ownerId);
  const isOwn = viewer?.id === product.ownerId;
  const submission = viewer ? submissionFor(product.id, viewer.id) : undefined;
  const approved = listWall(product.id);
  const requests = openRequests(product.id);
  const logo = logoUrl(product.logoKey);
  const justSubmitted = query.submitted === "1";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Link href="/explore" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
          ← Marketplace
        </Link>

        <header className="mt-4 flex flex-wrap items-start gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="size-14 rounded-2xl border border-zinc-200 bg-white object-contain p-1.5"
            />
          ) : (
            <div className="grid size-14 place-items-center rounded-2xl bg-zinc-900 text-xl font-semibold text-white">
              {product.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {product.name}
              </h1>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                {product.category}
              </span>
              {requests > 0 ? (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-200">
                  Wants a testimonial
                </span>
              ) : null}
              {product.isPublic ? null : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                  Unlisted preview
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              by {owner}
              {" · "}
              <a
                href={product.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800"
              >
                {new URL(product.websiteUrl).hostname}
              </a>
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
              {product.description}
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            {justSubmitted && submission ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Testimonial submitted</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  It is now pending {owner}&apos;s review. If approved, it will appear on the
                  public wall using the identity snapshot captured with this submission.
                </p>
                {submission.sourceType === "exchange" ? (
                  <p className="mt-4 inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    +5 credits added to your ledger
                  </p>
                ) : null}
                <Link
                  href="/dashboard/credits"
                  className="mt-4 flex text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View your credits →
                </Link>
              </div>
            ) : isOwn ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">This is your product</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  You cannot review your own product. Use the collection link to invite real
                  customers instead.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white"
                >
                  Go to dashboard
                </Link>
              </div>
            ) : submission ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  {submission.status === "withdrawn"
                    ? "You withdrew your testimonial"
                    : "You already submitted"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {submission.status === "withdrawn" ? (
                    "It is no longer published on the wall. Because each founder can submit once per product, you cannot submit another review here."
                  ) : (
                    <>
                      One testimonial per product per person. Current status:{" "}
                      <span className="font-medium capitalize text-zinc-800">
                        {submission.status}
                      </span>
                      .
                    </>
                  )}
                </p>
                {submission.status !== "withdrawn" ? (
                  <blockquote className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
                    {submission.content}
                  </blockquote>
                ) : null}
                {submission.status !== "withdrawn" ? (
                  <form action={withdrawTestimonial} className="mt-4">
                    <input type="hidden" name="id" value={submission.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-red-600"
                    >
                      Withdraw this testimonial
                    </button>
                  </form>
                ) : null}
              </div>
            ) : !product.acceptingTestimonials ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Not accepting testimonials
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {owner} has paused submissions for now. Check back later.
                </p>
              </div>
            ) : viewer ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Write a testimonial</h2>
                <p className="mb-4 mt-1 text-xs text-zinc-500">
                  Keep it specific. Use the product, say what changed, and avoid generic praise.
                </p>
                <TestimonialForm
                  slug={product.slug}
                  source="exchange"
                  author={{
                    name: viewer.name,
                    avatarUrl: viewer.avatarUrl,
                    identitySource: viewer.identitySource,
                    observedAt: viewer.identityObservedAt,
                  }}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Want to write a review?</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Sign in to submit a testimonial. Your signed-in identity is snapshotted at
                  submission time and shown with the review.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(paths.product(product.slug))}`}
                  className="mt-4 inline-flex rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white"
                >
                  Sign in to write
                </Link>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
              <p className="text-xs font-semibold text-indigo-950">Exchange model</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-indigo-900/75">
                <li>· Submit a review here, earn 5 credits.</li>
                <li>· Spend 1 credit to request a review of your own product.</li>
                <li>· Credits land on submission, not on approval.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold text-zinc-900">Identity</p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Reviewers sign in before submitting. Attest stores the name and picture
                presented at that moment, plus any headline the reviewer provided, and displays
                that snapshot — even if the sign-in account later changes.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-semibold text-zinc-900">
                {approved.length} published {approved.length === 1 ? "testimonial" : "testimonials"}
              </p>
              <Link
                href={paths.wall(product.slug)}
                className="mt-2 flex text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Open the full wall →
              </Link>
            </div>
          </aside>
        </div>

        {approved.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">What people say</h2>
              <Link
                href={paths.wall(product.slug)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                See all →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {approved.slice(0, 2).map((item) => (
                <TestimonialCard
                  key={item.id}
                  content={item.content}
                  snapshot={parseSnapshot(item.identitySnapshot)}
                  sourceType={item.sourceType}
                  submittedAt={item.submittedAt}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
