import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withdrawTestimonial } from "@/app/actions/testimonials";
import { CopyField } from "@/components/copy-field";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TestimonialForm } from "@/components/testimonial-form";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, ownerName, submissionFor } from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { baseUrl, paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share a testimonial — Attest",
  robots: { index: false, follow: false },
};

export default async function CollectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const viewer = await getCurrentUser();
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const owner = await ownerName(product.ownerId);
  const isOwn = viewer?.id === product.ownerId;
  const submission = viewer ? await submissionFor(product.id, viewer.id) : undefined;
  const logo = logoUrl(product.logoKey);
  const justSubmitted = query.submitted === "1";
  const base = isOwn ? await baseUrl() : "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="size-12 rounded-xl border border-zinc-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-zinc-900 text-base font-semibold text-white">
                {product.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Testimonial for
              </p>
              <p className="text-sm font-semibold text-zinc-900">{product.name}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{product.description}</p>

          <div className="mt-6 border-t border-zinc-100 pt-6">
            {isOwn ? (
              <div>
                <h1 className="text-sm font-semibold text-zinc-900">Your collection link</h1>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Share this page with your customers. Every testimonial collected here is free
                  — no credits are charged. You approve what appears on your wall.
                </p>
                <div className="mt-4 space-y-3">
                  <CopyField
                    label="Collection link"
                    value={`${base}${paths.collect(product.slug)}`}
                  />
                  <CopyField
                    label="Public wall"
                    value={`${base}${paths.wall(product.slug)}`}
                  />
                </div>
                <Link
                  href="/dashboard/inbox"
                  className="mt-4 inline-flex rounded-lg border border-zinc-300 px-3.5 py-2 text-xs font-medium text-zinc-700"
                >
                  Review submissions
                </Link>
              </div>
            ) : justSubmitted && submission ? (
              <div>
                <h1 className="text-sm font-semibold text-zinc-900">Thanks — submitted</h1>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Your testimonial is waiting for {owner} to review it. Nothing is published
                  automatically.
                </p>
                <blockquote className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
                  {submission.content}
                </blockquote>
              </div>
            ) : submission ? (
              <div>
                <h1 className="text-sm font-semibold text-zinc-900">
                  {submission.status === "withdrawn"
                    ? "You withdrew your testimonial"
                    : "You already shared feedback"}
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {submission.status === "withdrawn" ? (
                    "It is no longer published on the wall."
                  ) : (
                    <>
                      Status:{" "}
                      <span className="font-medium capitalize text-zinc-800">
                        {submission.status}
                      </span>
                      . Only one testimonial per product is accepted from each person.
                    </>
                  )}
                </p>
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
                <h1 className="text-sm font-semibold text-zinc-900">Submissions are paused</h1>
                <p className="mt-1 text-xs text-zinc-500">
                  {owner} is not collecting testimonials right now.
                </p>
              </div>
            ) : viewer ? (
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  Share your experience with {product.name}
                </h1>
                <p className="mb-5 mt-1 text-sm leading-relaxed text-zinc-600">
                  {owner} invited you to write a testimonial. It will be reviewed before
                  anything is published.
                </p>
                <TestimonialForm
                  slug={product.slug}
                  source="customer"
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
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  {owner} invited you to share a testimonial
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                  Sign in with LinkedIn (or a local identity in development) so your name and
                  headline can be attached to the review, then you will come straight back here.
                  This collection is free for the product owner.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(paths.collect(product.slug))}`}
                  className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Sign in to write your review
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-400">
          Your identity snapshot is stored with the testimonial. The product owner decides
          whether it is published. Attest does not post to LinkedIn.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
