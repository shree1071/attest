import Link from "next/link";
import { moderateTestimonial, reorderTestimonial } from "@/app/actions/testimonials";
import { CopyField } from "@/components/copy-field";
import { SubmitButton } from "@/components/submit-button";
import { TestimonialCard } from "@/components/testimonial-card";
import { WallCustomizer } from "@/components/wall-customizer";
import { requireUser } from "@/lib/auth";
import { parseSnapshot } from "@/lib/identity";
import { getOwnedProduct, listWall } from "@/lib/queries";
import { baseUrl, embedSnippet, paths } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function DashboardWallPage() {
  const user = await requireUser("/dashboard/wall");
  const product = getOwnedProduct(user.id);

  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-zinc-700">No wall yet.</p>
        <p className="mt-1 text-xs text-zinc-500">Create your product to get a public wall.</p>
        <Link
          href="/dashboard/product"
          className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Set up product
        </Link>
      </div>
    );
  }

  const approved = listWall(product.id);
  const base = await baseUrl();
  const wallUrl = `${base}${paths.wall(product.slug)}`;
  const embedUrl = `${base}${paths.embed(product.slug)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <aside className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Customizable Widgets</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Configure layout and theme. Only approved testimonials render on the public wall.
          </p>
          <div className="mt-4">
            <WallCustomizer slug={product.slug} name={product.name} baseUrl={base} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 text-xs leading-relaxed text-zinc-500">
          <p className="font-medium text-zinc-800">Curated, not a review feed</p>
          <p className="mt-1.5">
            You choose what appears on this wall. Attest does not add, edit or fabricate
            testimonials — every card is a submission you approved.
          </p>
        </section>
      </aside>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Published · {approved.length}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Reorder with the arrows. Newest approved entries start at the bottom.
            </p>
          </div>
          <Link href="/dashboard/inbox" className="text-xs font-medium text-indigo-600">
            Approve more →
          </Link>
        </div>

        {approved.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
            <p className="text-sm text-zinc-600">No published testimonials.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Approve submissions from your inbox and they will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {approved.map((item, index) => (
              <div key={item.id} className="relative">
                <TestimonialCard
                  content={item.content}
                  snapshot={parseSnapshot(item.identitySnapshot)}
                  sourceType={item.sourceType}
                  submittedAt={item.submittedAt}
                  status={item.status}
                  rating={item.rating ?? 5}
                  footer={
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-400">Position {index + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <form action={reorderTestimonial}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <SubmitButton
                            disabled={index === 0}
                            ariaLabel="Move up"
                            pendingLabel="…"
                            className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 transition hover:border-zinc-400 disabled:opacity-30"
                          >
                            ↑
                          </SubmitButton>
                        </form>
                        <form action={reorderTestimonial}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <SubmitButton
                            disabled={index === approved.length - 1}
                            ariaLabel="Move down"
                            pendingLabel="…"
                            className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 transition hover:border-zinc-400 disabled:opacity-30"
                          >
                            ↓
                          </SubmitButton>
                        </form>
                        <form action={moderateTestimonial}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <input type="hidden" name="tab" value="approved" />
                          <SubmitButton
                            pendingLabel="Removing…"
                            className="rounded-md border border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          >
                            Unpublish
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
