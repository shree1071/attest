import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { logoUrl } from "@/lib/uploads";
import { exploreProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const category = (params.category ?? "").trim() || null;
  const user = await getCurrentUser();
  const items = await exploreProducts(user?.id ?? null, query, category);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Marketplace</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Products waiting for an honest testimonial. Write one, earn 5 credits.
            </p>
          </div>
          <form className="flex items-center gap-2" action="/explore">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <input
              name="q"
              defaultValue={query}
              placeholder="Search products"
              aria-label="Search products"
              className="w-56 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          <Link
            href={`/explore${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === null
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((item) => {
            const active = category === item;
            const search = new URLSearchParams();
            if (query) search.set("q", query);
            search.set("category", item);
            return (
              <Link
                key={item}
                href={`/explore?${search.toString()}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {item}
              </Link>
            );
          })}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-zinc-700">No products match that search.</p>
            <p className="mt-1 text-xs text-zinc-500">
              Try a different keyword, or list your own product to be the first.
            </p>
            {user ? (
              <Link
                href="/dashboard/product"
                className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                List your product
              </Link>
            ) : (
              <Link
                href="/login"
                className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Start free
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ product, approvedCount, openRequests, alreadySubmitted, isOwn }) => {
              const logo = logoUrl(product.logoKey);
              const href = isOwn ? "/dashboard/product" : `/product/${product.slug}`;
              return (
                <div
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex items-start gap-3">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="size-11 rounded-xl border border-zinc-200 bg-white object-contain p-1"
                      />
                    ) : (
                      <div className="grid size-11 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
                        {product.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                      <p className="text-[11px] text-zinc-500">{product.category}</p>
                    </div>
                    {openRequests > 0 && product.acceptingTestimonials ? (
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-200">
                        Wants a review
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-relaxed text-zinc-600">
                    {product.description}
                  </p>

                  <a
                    href={product.websiteUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 truncate text-[11px] text-zinc-400 underline decoration-zinc-200 underline-offset-2 hover:text-zinc-600"
                  >
                    {new URL(product.websiteUrl).hostname}
                  </a>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                    <span className="text-[11px] text-zinc-400">
                      {approvedCount} {approvedCount === 1 ? "testimonial" : "testimonials"}
                    </span>
                    {alreadySubmitted ? (
                      <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500">
                        Submitted
                      </span>
                    ) : isOwn ? (
                      <Link
                        href={href}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
                      >
                        Your product
                      </Link>
                    ) : !product.acceptingTestimonials ? (
                      <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500">
                        Not accepting
                      </span>
                    ) : (
                      <Link
                        href={href}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
                      >
                        Write a testimonial
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
