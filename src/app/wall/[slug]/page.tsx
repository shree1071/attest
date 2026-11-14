import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TestimonialCard } from "@/components/testimonial-card";
import { getCurrentUser } from "@/lib/auth";
import { parseSnapshot } from "@/lib/identity";
import { getProductBySlug, listWall, ownerName } from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const product = getProductBySlug(slug);
  if (!product || !product.isPublic) return { title: "Wall not available — Attest" };
  return {
    title: `${product.name} testimonials — Attest`,
    description: `Approved testimonials for ${product.name}.`,
    ...(query.embed === "1" ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function WallPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const embed = query.embed === "1";
  const viewer = await getCurrentUser();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  if (!product.isPublic && viewer?.id !== product.ownerId) notFound();

  const owner = ownerName(product.ownerId);
  const items = listWall(product.id);
  const logo = logoUrl(product.logoKey);

  return (
    <div className={embed ? "min-h-screen bg-white" : "flex min-h-screen flex-col"}>
      {embed ? null : <SiteHeader />}

      <main
        className={
          embed
            ? "mx-auto w-full max-w-5xl px-4 py-6"
            : "mx-auto w-full max-w-5xl flex-1 px-4 py-10"
        }
      >
        <header className={embed ? "flex items-center gap-3" : "flex flex-wrap items-center gap-4"}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className={`${embed ? "size-9 rounded-lg" : "size-12 rounded-xl"} border border-zinc-200 bg-white object-contain p-1`}
            />
          ) : (
            <div
              className={`${embed ? "size-9 rounded-lg text-sm" : "size-12 rounded-xl text-lg"} grid place-items-center bg-zinc-900 font-semibold text-white`}
            >
              {product.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1
              className={`${embed ? "text-base" : "text-xl"} font-semibold tracking-tight text-zinc-900`}
            >
              {product.name}
            </h1>
            <p className="text-[11px] text-zinc-500">
              {items.length} curated {items.length === 1 ? "testimonial" : "testimonials"} · by {owner}
            </p>
          </div>
          {embed ? null : (
            <Link
              href={paths.product(product.slug)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              About {product.name}
            </Link>
          )}
        </header>

        {embed ? null : (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            {product.description}
          </p>
        )}

        {items.length === 0 ? (
          <div
            className={`${embed ? "mt-5 py-12" : "mt-8 py-16"} rounded-2xl border border-dashed border-zinc-300 bg-white px-6 text-center`}
          >
            <p className="text-sm text-zinc-600">No testimonials published yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              This wall only shows testimonials the product owner approved.
            </p>
          </div>
        ) : (
          <div
            className={`${embed ? "mt-5" : "mt-8"} grid gap-4 sm:grid-cols-2 ${embed ? "" : "lg:grid-cols-3"}`}
          >
            {items.map((item) => (
              <TestimonialCard
                key={item.id}
                content={item.content}
                snapshot={parseSnapshot(item.identitySnapshot)}
                sourceType={item.sourceType}
                submittedAt={item.submittedAt}
                muted={embed}
              />
            ))}
          </div>
        )}

        {embed ? (
          <p className="mt-4 text-center text-[10px] text-zinc-400">
            Curated testimonials · powered by{" "}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-600"
            >
              Attest
            </a>
          </p>
        ) : null}
      </main>

      {embed ? null : <SiteFooter />}
    </div>
  );
}
