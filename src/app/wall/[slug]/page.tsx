import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestimonialCard } from "@/components/testimonial-card";
import { Avatar } from "@/components/avatar";
import { Wordmark } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { parseSnapshot } from "@/lib/identity";
import { getProductBySlug, listWall, ownerName } from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

type WallQuery = {
  embed?: string;
  theme?: string;
  layout?: string;
  accent?: string;
  limit?: string;
  cta?: string;
  animation?: string;
};

const LAYOUTS = ["wall", "grid", "carousel", "badge"] as const;
type Layout = (typeof LAYOUTS)[number];

const ANIMATIONS = ["none", "fade", "up", "zoom", "slide", "flip"] as const;
type Animation = (typeof ANIMATIONS)[number];

const DEFAULT_ACCENT = "#2563eb";

function resolveAnimation(raw?: string): Animation {
  return ANIMATIONS.includes(raw as Animation) ? (raw as Animation) : "up";
}

function resolveAccent(raw?: string): string {
  return raw && /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : DEFAULT_ACCENT;
}

function resolveLayout(raw?: string): Layout {
  // "masonry" is the legacy name for the floating wall layout.
  if (raw === "masonry") return "wall";
  return LAYOUTS.includes(raw as Layout) ? (raw as Layout) : "wall";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<WallQuery>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product || !product.isPublic) return { title: "Wall not available — Attest" };
  return {
    title: `${product.name} testimonials — Attest`,
    description: `Approved testimonials for ${product.name}.`,
    ...(query.embed === "1" ? { robots: { index: false, follow: false } } : {}),
  };
}

function RatingSummary({
  items,
  isDark,
  accent,
  compact = false,
}: {
  items: { rating: number | null }[];
  isDark: boolean;
  accent: string;
  compact?: boolean;
}) {
  const avg =
    items.length > 0
      ? (items.reduce((acc, item) => acc + (item.rating ?? 5), 0) / items.length).toFixed(1)
      : "5.0";

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "sm:gap-3"}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`${compact ? "size-3.5" : "size-4"} ${
              i < Math.round(Number(avg))
                ? "fill-amber-400 text-amber-400"
                : isDark
                  ? "fill-zinc-800 text-zinc-800"
                  : "fill-zinc-200 text-zinc-200"
            }`}
            aria-hidden
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span
        className={`font-semibold ${compact ? "text-xs" : "text-sm"} ${
          isDark ? "text-zinc-200" : "text-zinc-800"
        }`}
        style={{ color: accent }}
      >
        {avg}
      </span>
      <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
        ({items.length} {items.length === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

export default async function WallPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<WallQuery>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const embed = query.embed === "1";
  const theme = query.theme === "dark" ? "dark" : "light";
  const isDark = theme === "dark";
  const layout = resolveLayout(query.layout);
  const accent = resolveAccent(query.accent);
  const animation = resolveAnimation(query.animation);
  const animAttr = animation === "none" ? {} : { "data-anim": animation };
  const showCta = !embed && query.cta !== "0";

  const viewer = await getCurrentUser();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  if (!product.isPublic && viewer?.id !== product.ownerId) notFound();

  const owner = await ownerName(product.ownerId);
  const logo = logoUrl(product.logoKey);
  const allItems = await listWall(product.id);
  const parsedLimit = Number.parseInt(query.limit ?? "", 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : null;
  const items = limit ? allItems.slice(0, limit) : allItems;

  /* Compact social-proof badge: drops straight into a navbar or footer. */
  if (layout === "badge") {
    const avatarList = items.slice(0, 4).map((item) => parseSnapshot(item.identitySnapshot));

    return (
      <div className="inline-flex p-2">
        <a
          href={`${paths.wall(product.slug)}?theme=${theme}&layout=wall`}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-3 rounded-full border py-2 pl-2 pr-4 no-underline transition hover:shadow-md ${
            isDark
              ? "border-zinc-800 bg-zinc-900 text-white"
              : "border-zinc-200/80 bg-white text-zinc-900 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]"
          }`}
        >
          <div className="flex -space-x-2 overflow-hidden">
            {avatarList.length > 0 ? (
              avatarList.map((snap, idx) => (
                <span
                  key={idx}
                  className={`inline-block rounded-full ring-2 ${
                    isDark ? "ring-zinc-900" : "ring-white"
                  }`}
                >
                  <Avatar name={snap.display_name} src={snap.avatar_url} size={26} accent={accent} />
                </span>
              ))
            ) : (
              <span className="grid size-[26px] place-items-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                0
              </span>
            )}
          </div>
          <RatingSummary items={items} isDark={isDark} accent={accent} compact />
        </a>
      </div>
    );
  }

  const card = (item: (typeof items)[number]) => (
    <TestimonialCard
      content={item.content}
      snapshot={parseSnapshot(item.identitySnapshot)}
      sourceType={item.sourceType}
      submittedAt={item.submittedAt}
      rating={item.rating ?? 5}
      theme={theme}
      variant="wall"
      accent={accent}
    />
  );

  const canvasClass = isDark
    ? "min-h-screen bg-zinc-950 text-zinc-100"
    : "min-h-screen bg-[#eef1f5] text-zinc-900";

  const pill = isDark
    ? "bg-zinc-900/85 ring-1 ring-white/10 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)]"
    : "bg-white/85 ring-1 ring-black/5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)]";
  const navItem = `rounded-full px-3 py-1.5 transition ${
    isDark ? "text-zinc-400 hover:bg-white/5 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;

  const header = (
    <div className={embed ? "" : "mx-auto w-full max-w-6xl"}>
      <div className="flex items-center gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            className={`${embed ? "size-11 rounded-xl" : "size-12 rounded-2xl"} border ${
              isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200/80 bg-white"
            } object-contain p-1`}
          />
        ) : (
          <div
            className={`${embed ? "size-11 rounded-xl text-base" : "size-12 rounded-2xl text-lg"} grid place-items-center font-semibold text-white`}
            style={{
              backgroundImage: `linear-gradient(140deg, ${accent}, color-mix(in oklab, ${accent} 70%, #000))`,
            }}
          >
            {product.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={`${embed ? "text-lg" : "text-xl"} truncate font-semibold tracking-tight ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            {product.name}
          </h1>
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            {allItems.length} curated {allItems.length === 1 ? "testimonial" : "testimonials"} · by{" "}
            {owner}
          </p>
        </div>
        <RatingSummary items={allItems} isDark={isDark} accent={accent} />
      </div>
    </div>
  );

  const grid =
    items.length === 0 ? (
      <div
        className={`${embed ? "mt-6 py-12" : "mt-8 py-16"} rounded-[26px] border border-dashed ${
          isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-300 bg-white/70"
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
      <div className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="w-[320px] shrink-0 snap-start sm:w-[350px]"
            {...animAttr}
            style={{ ["--i" as string]: index }}
          >
            {card(item)}
          </div>
        ))}
      </div>
    ) : layout === "grid" ? (
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            {...animAttr}
            style={{ ["--i" as string]: index }}
          >
            {card(item)}
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-6 columns-1 gap-5 sm:columns-2 lg:columns-3 [column-fill:balance]">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="mb-5 break-inside-avoid"
            {...animAttr}
            style={{ ["--i" as string]: index }}
          >
            {card(item)}
          </div>
        ))}
      </div>
    );

  if (embed) {
    return (
      <div className={canvasClass} style={{ ["--attest-accent" as string]: accent }}>
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          {header}
          {grid}
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
        </main>
      </div>
    );
  }

  return (
    <div className={`relative flex min-h-screen flex-col ${canvasClass}`}>
      {/* Ambient light behind the floating cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{
          background: isDark
            ? `radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, ${accent} 22%, transparent), transparent 70%)`
            : `radial-gradient(55% 50% at 50% 0%, color-mix(in oklab, ${accent} 16%, transparent), transparent 72%)`,
        }}
      />
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link
            href={paths.product(product.slug)}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 backdrop-blur ${pill}`}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className={`size-8 rounded-full border object-contain p-1 ${
                  isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
                }`}
              />
            ) : (
              <span
                className="grid size-8 place-items-center rounded-full text-sm font-semibold text-white"
                style={{
                  backgroundImage: `linear-gradient(140deg, ${accent}, color-mix(in oklab, ${accent} 70%, #000))`,
                }}
              >
                {product.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span
              className={`max-w-32 truncate text-sm font-semibold tracking-tight ${
                isDark ? "text-white" : "text-zinc-900"
              }`}
            >
              {product.name}
            </span>
          </Link>

          <nav
            className={`mx-auto hidden items-center gap-0.5 rounded-full p-1 text-xs font-medium backdrop-blur md:flex ${pill}`}
            aria-label="Wall sections"
          >
            <a href="#reviews" className={navItem}>
              Reviews
            </a>
            <Link href={paths.product(product.slug)} className={navItem}>
              About
            </Link>
            {product.acceptingTestimonials ? (
              <Link href={paths.collect(product.slug)} className={navItem}>
                Leave a review
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto md:ml-0">
            {viewer ? (
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-semibold backdrop-blur ${pill} ${
                  isDark ? "text-zinc-200" : "text-zinc-700"
                }`}
              >
                <Avatar name={viewer.name} src={viewer.avatarUrl} size={24} />
                Dashboard
              </Link>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(paths.wall(product.slug))}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold backdrop-blur ${pill} ${
                  isDark ? "text-white" : "text-zinc-800"
                }`}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:pt-14" id="reviews">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${
              isDark
                ? "border-zinc-800 bg-zinc-900/70 text-zinc-300"
                : "border-white/70 bg-white/80 text-zinc-600 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]"
            }`}
          >
            <span className="size-1.5 rounded-full" style={{ background: accent }} />
            Wall of love
          </span>
          <h2
            className={`mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-[2.6rem] sm:leading-[1.1] ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            What people say about {product.name}
          </h2>
          {product.description ? (
            <p
              className={`mx-auto mt-3 max-w-xl text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              {product.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div
              className={`inline-flex items-center gap-3 rounded-full px-4 py-2 ${
                isDark ? "bg-zinc-900/70" : "bg-white/80 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]"
              }`}
            >
              <RatingSummary items={allItems} isDark={isDark} accent={accent} />
            </div>
            {product.acceptingTestimonials ? (
              <Link
                href={paths.collect(product.slug)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-16px_rgba(37,99,235,0.9)] transition hover:brightness-110"
                style={{ background: accent }}
              >
                Leave a testimonial
                <span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-10">{grid}</div>

        <p className={`mt-12 text-center text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
          {limit ? `${items.length} of ${allItems.length} testimonials` : `${allItems.length} testimonials`}{" "}
          · curated by {owner} ·{" "}
          <Link href={paths.product(product.slug)} className="font-medium underline underline-offset-2">
            About {product.name}
          </Link>
        </p>
      </main>

      <footer className={`relative border-t ${isDark ? "border-zinc-900" : "border-white/60"}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row">
          <Wordmark />
          <p>Every card is a submission this team approved. Nothing is fabricated.</p>
        </div>
      </footer>

      {showCta ? (
        <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
          <div className="mx-auto flex max-w-6xl items-end justify-end gap-2.5 px-4 pb-5">
            {product.acceptingTestimonials ? (
              <Link
                href={paths.collect(product.slug)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.85)] transition hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: accent }}
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.33 5.1 3.42 6.66L4.5 21l3.6-1.38A11.4 11.4 0 0 0 12 20c5.52 0 10-4.03 10-9s-4.48-9-10-9Zm0 16.3c-1.3 0-2.55-.3-3.66-.85l-.26-.13-2.4.92.66-2.28-.18-.27A7.2 7.2 0 0 1 4.5 11c0-3.86 3.36-7 7.5-7s7.5 3.14 7.5 7-3.36 7.3-7.5 7.3Z" />
                </svg>
                Leave a testimonial
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
