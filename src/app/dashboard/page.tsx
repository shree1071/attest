import Link from "next/link";
import { CopyField } from "@/components/copy-field";
import { requireUser } from "@/lib/auth";
import { balanceOf } from "@/lib/credits";
import { formatDate } from "@/lib/format";
import { parseSnapshot } from "@/lib/identity";
import {
  countByStatus,
  getOwnedProduct,
  listByStatus,
  openRequests,
} from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { baseUrl, paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await requireUser("/dashboard");
  const product = getOwnedProduct(user.id);
  const balance = balanceOf(user.id);

  if (!product) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Create your product to start
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
          Your product gets a public page, a testimonial collection link and an embeddable
          wall. You only need a name, a short description and a website.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Product profile", "Name, logo, description and public slug."],
            ["Collection link", "Share it with customers. Their reviews are free."],
            ["Public wall", "Approve what appears, embed it anywhere."],
          ].map(([title, body], index) => (
            <li key={title} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
              <span className="grid size-6 place-items-center rounded-md bg-zinc-900 text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-medium text-zinc-800">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/dashboard/product"
          className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Set up your product
        </Link>
      </div>
    );
  }

  const counts = countByStatus(product.id);
  const requests = openRequests(product.id);
  const pending = listByStatus(product.id, "pending").slice(0, 3);
  const logo = logoUrl(product.logoKey);
  const base = await baseUrl();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Credits available", value: balance, href: "/dashboard/credits" },
          { label: "Pending review", value: counts.pending, href: "/dashboard/inbox" },
          { label: "Published", value: counts.approved, href: "/dashboard/wall" },
          { label: "Open requests", value: requests, href: "/dashboard/credits" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start gap-3">
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-zinc-900">{product.name}</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                  {product.category}
                </span>
                {product.isPublic ? null : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                    Not listed
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                {product.description}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <CopyField
              label="Collection link (free)"
              value={`${base}${paths.collect(product.slug)}`}
            />
            <CopyField label="Public wall" value={`${base}${paths.wall(product.slug)}`} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/product"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              Edit product
            </Link>
            <Link
              href={`/wall/${product.slug}`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              View wall
            </Link>
            <Link
              href="/explore"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              Review others, earn credits
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Latest submissions</h2>
            <Link href="/dashboard/inbox" className="text-xs font-medium text-indigo-600">
              Open inbox
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center">
              <p className="text-xs text-zinc-500">Nothing waiting for approval.</p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Share your collection link to get your first testimonial.
              </p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {pending.map((item) => {
                const snapshot = parseSnapshot(item.identitySnapshot);
                return (
                  <li key={item.id} className="py-3 first:pt-2 last:pb-0">
                    <p className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-800">
                      {snapshot.display_name}
                      <span className="text-[10px] font-normal text-zinc-400">
                        {formatDate(item.submittedAt)}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                      {item.content}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-indigo-950">
              Earn credits by reviewing another product
            </h2>
            <p className="mt-1 text-xs text-indigo-900/70">
              1 testimonial given = 5 credits. Community reviews are separate from your own
              customer collection, which never costs credits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/credits"
              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800"
            >
              Request with credits
            </Link>
            <Link
              href="/explore"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
