import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TestimonialCard } from "@/components/testimonial-card";
import { Avatar } from "@/components/avatar";
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
  searchParams: Promise<{ embed?: string; theme?: string; layout?: string }>;
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
  searchParams: Promise<{ embed?: string; theme?: string; layout?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const embed = query.embed === "1";
  const theme = query.theme === "dark" ? "dark" : "light";
  const layout = query.layout || "masonry"; // 'masonry' | 'carousel' | 'badge' | 'grid'
  const isDark = theme === "dark";

  const viewer = await getCurrentUser();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  if (!product.isPublic && viewer?.id !== product.ownerId) notFound();

  const owner = ownerName(product.ownerId);
  const items = listWall(product.id);
  const logo = logoUrl(product.logoKey);

  // Badge Widget mode: sleek compact social proof badge
  if (layout === "badge") {
    const avatarList = items.slice(0, 4).map((item) => parseSnapshot(item.identitySnapshot));
    const avgRating =
      items.length > 0
        ? (items.reduce((acc, curr) => acc + (curr.rating ?? 5), 0) / items.length).toFixed(1)
        : "5.0";

    return (
      <div className={`p-2 inline-flex items-center gap-3 rounded-full border px-4 py-2 transition-all ${
        isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
      }`}>
        <div className="flex -space-x-2 overflow-hidden">
          {avatarList.map((snap, idx) => (
            <div key={idx} className="inline-block ring-2 ring-white dark:ring-zinc-900 rounded-full">
              <Avatar name={snap.display_name} src={snap.avatar_url} size={24} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
          <span className="font-semibold">{avgRating}</span>
          <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
            ({items.length} reviews)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={embed ? (isDark ? "min-h-screen bg-zinc-950 text-zinc-100" : "min-h-screen bg-white text-zinc-900") : "flex min-h-screen flex-col"}>
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
              className={`${embed ? "size-9 rounded-lg" : "size-12 rounded-xl"} border ${
                isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
              } object-contain p-1`}
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
              className={`${embed ? "text-base" : "text-xl"} font-semibold tracking-tight ${
                isDark ? "text-white" : "text-zinc-900"
              }`}
            >
              {product.name}
            </h1>
            <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
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
            className={`${embed ? "mt-5 py-12" : "mt-8 py-16"} rounded-2xl border border-dashed ${
              isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-300 bg-white"
            } px-6 text-center`}
          >
            <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              No testimonials published yet.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              This wall only shows testimonials the product owner approved.
            </p>
          </div>
        ) : layout === "carousel" ? (
          /* Senja-style Horizontal Scroll Carousel */
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {items.map((item) => (
              <div key={item.id} className="w-[320px] flex-shrink-0 snap-start">
                <TestimonialCard
                  content={item.content}
                  snapshot={parseSnapshot(item.identitySnapshot)}
                  sourceType={item.sourceType}
                  submittedAt={item.submittedAt}
                  rating={item.rating ?? 5}
                  theme={theme}
                  muted={embed}
                />
              </div>
            ))}
          </div>
        ) : (
          /* True Wall of Love Masonry Grid */
          <div
            className={`mt-6 columns-1 sm:columns-2 ${
              embed ? "" : "lg:columns-3"
            } gap-4 space-y-4`}
          >
            {items.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <TestimonialCard
                  content={item.content}
                  snapshot={parseSnapshot(item.identitySnapshot)}
                  sourceType={item.sourceType}
                  submittedAt={item.submittedAt}
                  rating={item.rating ?? 5}
                  theme={theme}
                  muted={embed}
                />
              </div>
            ))}
          </div>
        )}

        {embed ? (
          <p className="mt-6 text-center text-[10px] text-zinc-400">
            Curated testimonials · powered by{" "}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-500"
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
