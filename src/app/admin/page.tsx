import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { adminModerateTestimonial, adminToggleUserRestriction } from "@/app/actions/admin";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseSnapshot } from "@/lib/identity";
import { auditEvents, products, testimonials, users } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const admin = await requireAdmin();

  const allUsers = db.select().from(users).all();
  const allProducts = db.select().from(products).all();
  const allTestimonials = db
    .select({
      testimonial: testimonials,
      product: products,
      author: users,
    })
    .from(testimonials)
    .innerJoin(products, eq(products.id, testimonials.productId))
    .innerJoin(users, eq(users.id, testimonials.authorId))
    .orderBy(desc(testimonials.submittedAt))
    .all();

  const recentAudits = db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(10)
    .all();

  const pendingCount = allTestimonials.filter((t) => t.testimonial.status === "pending").length;
  const approvedCount = allTestimonials.filter((t) => t.testimonial.status === "approved").length;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Admin Governance Portal</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                Staff Moderation
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Platform-wide moderation queue, reviewer anti-farming controls, and audit event logs.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Total Users</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{allUsers.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Active Products</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{allProducts.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Pending Review</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Approved Reviews</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{approvedCount}</p>
          </div>
        </div>

        {/* Global Moderation Queue */}
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Cross-Product Moderation Queue</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Review submissions across all products. Flag abusive reviews or restrict accounts.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-zinc-100 overflow-x-auto">
            {allTestimonials.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400">No submissions found on the platform.</p>
            ) : (
              allTestimonials.map(({ testimonial, product, author }) => {
                const snapshot = parseSnapshot(testimonial.identitySnapshot);
                return (
                  <div key={testimonial.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-900">{snapshot.display_name}</span>
                          <span className="text-xs text-zinc-400">for</span>
                          <Link href={`/product/${product.slug}`} className="text-xs font-medium text-indigo-600 hover:underline">
                            {product.name}
                          </Link>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ${
                            testimonial.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : testimonial.status === "rejected"
                                ? "bg-red-50 text-red-700 ring-red-200"
                                : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}>
                            {testimonial.status}
                          </span>
                          {author.isRestricted ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              RESTRICTED USER
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                        <p className="text-[11px] text-zinc-400">
                          {testimonial.sourceType === "exchange" ? "Community Exchange (+5 credits)" : "Direct Customer"} · Rating: {testimonial.rating ?? 5}/5 ★
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {testimonial.status !== "approved" ? (
                          <form action={adminModerateTestimonial}>
                            <input type="hidden" name="id" value={testimonial.id} />
                            <input type="hidden" name="action" value="approved" />
                            <SubmitButton className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                              Approve
                            </SubmitButton>
                          </form>
                        ) : null}

                        {testimonial.status !== "rejected" ? (
                          <form action={adminModerateTestimonial}>
                            <input type="hidden" name="id" value={testimonial.id} />
                            <input type="hidden" name="action" value="rejected" />
                            <SubmitButton className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                              Reject
                            </SubmitButton>
                          </form>
                        ) : null}

                        <form action={adminToggleUserRestriction}>
                          <input type="hidden" name="userId" value={author.id} />
                          <SubmitButton className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                            author.isRestricted
                              ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                              : "border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
                          }`}>
                            {author.isRestricted ? "Lift Restriction" : "Restrict User"}
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Audit Log Trail */}
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-900">Platform Audit Event Logs</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Immutable log of staff moderation decisions and reviewer restrictions.
          </p>

          <div className="mt-4 divide-y divide-zinc-100 text-xs">
            {recentAudits.length === 0 ? (
              <p className="py-4 text-center text-zinc-400">No audit events recorded yet.</p>
            ) : (
              recentAudits.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2.5">
                  <span className="font-mono font-medium text-zinc-800">{event.action}</span>
                  <span className="text-zinc-500">{event.reason || "Action performed"}</span>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
