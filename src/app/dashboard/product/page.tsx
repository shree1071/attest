import Link from "next/link";
import { CopyField } from "@/components/copy-field";
import { ProductForm } from "@/components/product-form";
import { requireUser } from "@/lib/auth";
import { getOwnedProduct } from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";
import { baseUrl, paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function ProductSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser("/dashboard/product");
  const params = await searchParams;
  const product = await getOwnedProduct(user.id);
  const base = await baseUrl();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {product ? "Product profile" : "Create your product"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              This powers your public page, collection link and wall.
            </p>
          </div>
          {product ? (
            <Link
              href={`/product/${product.slug}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View public page
            </Link>
          ) : null}
        </div>

        {params.saved ? (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
            Product saved.
          </p>
        ) : null}

        <ProductForm
          initial={
            product
              ? {
                  name: product.name,
                  description: product.description,
                  websiteUrl: product.websiteUrl,
                  category: product.category,
                  slug: product.slug,
                  logoUrl: logoUrl(product.logoKey),
                  isPublic: product.isPublic,
                  acceptingTestimonials: product.acceptingTestimonials,
                }
              : null
          }
        />
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Your links</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {product
              ? "Share the collection link with customers. Their reviews are free."
              : "Links appear after you save the product."}
          </p>
          {product ? (
            <div className="mt-4 space-y-3">
              <CopyField
                label="Public product page"
                value={`${base}${paths.product(product.slug)}`}
              />
              <CopyField
                label="Collection link"
                value={`${base}${paths.collect(product.slug)}`}
              />
              <CopyField label="Public wall" value={`${base}${paths.wall(product.slug)}`} />
            </div>
          ) : (
            <ul className="mt-4 space-y-2 text-xs leading-relaxed text-zinc-500">
              <li>· A public page at /product/your-slug</li>
              <li>· A collection page at /collect/your-slug</li>
              <li>· A wall at /wall/your-slug</li>
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
          <h3 className="text-sm font-semibold text-zinc-900">A note on slugs</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            One product per account for now. Pick a slug you are happy to keep: changing it
            later breaks links people have already saved, and old wall URLs are not redirected
            in this build.
          </p>
        </div>
      </aside>
    </div>
  );
}
