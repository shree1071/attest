import Link from "next/link";
import { moderateTestimonial } from "@/app/actions/testimonials";
import { SubmitButton } from "@/components/submit-button";
import { TestimonialCard } from "@/components/testimonial-card";
import { requireUser } from "@/lib/auth";
import { parseSnapshot } from "@/lib/identity";
import { countByStatus, getOwnedProduct, listByStatus } from "@/lib/queries";
import type { Testimonial } from "@/lib/schema";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser("/dashboard/inbox");
  const params = await searchParams;
  const tab: TabKey = tabs.some((item) => item.key === params.tab)
    ? (params.tab as TabKey)
    : "pending";
  const product = await getOwnedProduct(user.id);

  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
        <p className="text-sm font-medium text-zinc-700">No product yet.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Create your product to receive testimonials.
        </p>
        <Link
          href="/dashboard/product"
          className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Set up product
        </Link>
      </div>
    );
  }

  const counts = await countByStatus(product.id);
  const items = await listByStatus(product.id, tab);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Received testimonials</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Approval controls what appears on your wall. Rejections do not reverse the
            reviewer&apos;s credits unless abuse is proven.
          </p>
        </div>
        <Link
          href="/dashboard/wall"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
        >
          Manage wall order
        </Link>
      </div>

      <div className="flex gap-1.5">
        {tabs.map((item) => {
          const active = item.key === tab;
          return (
            <Link
              key={item.key}
              href={`/dashboard/inbox?tab=${item.key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${active ? "text-zinc-300" : "text-zinc-400"}`}>
                {counts[item.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <p className="text-sm text-zinc-600">
            {tab === "pending"
              ? "Nothing waiting for review."
              : tab === "approved"
                ? "No testimonials published yet."
                : "No rejected testimonials."}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {tab === "pending"
              ? "Share your collection link or request a marketplace testimonial."
              : "Approved testimonials appear on your public wall and embed."}
          </p>
          {tab === "pending" ? (
            <Link
              href="/dashboard"
              className="mt-5 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700"
            >
              Get your collection link
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item: Testimonial) => {
            const snapshot = parseSnapshot(item.identitySnapshot);
            return (
              <TestimonialCard
                key={item.id}
                content={item.content}
                snapshot={snapshot}
                sourceType={item.sourceType}
                submittedAt={item.submittedAt}
                status={item.status}
                rating={item.rating ?? 5}
                footer={
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400">
                      {item.status === "approved" && item.approvedAt
                        ? `Published ${item.approvedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : item.status === "rejected" && item.rejectedAt
                          ? `Rejected ${item.rejectedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : "Awaiting your decision"}
                    </span>
                    <div className="flex gap-1.5">
                      {item.status !== "approved" ? (
                        <form action={moderateTestimonial}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <input type="hidden" name="tab" value={tab} />
                          <SubmitButton
                            pendingLabel="Approving…"
                            className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {item.status === "rejected" ? "Approve anyway" : "Approve"}
                          </SubmitButton>
                        </form>
                      ) : null}
                      {item.status !== "rejected" ? (
                        <form action={moderateTestimonial}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <input type="hidden" name="tab" value={tab} />
                          <SubmitButton
                            pendingLabel="Updating…"
                            className="rounded-md border border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-50"
                          >
                            {item.status === "approved" ? "Unpublish" : "Reject"}
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
