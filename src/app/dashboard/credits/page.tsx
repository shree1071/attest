import Link from "next/link";
import { requestTestimonial } from "@/app/actions/credits";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { balanceOf, CREDITS_PER_REQUEST, CREDITS_PER_REVIEW } from "@/lib/credits";
import { formatDate } from "@/lib/format";
import { getOwnedProduct, ledgerFor, openRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  earned: "Review submitted",
  spent: "Testimonial requested",
  refund: "Refund",
  adjustment: "Adjustment",
};

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const user = await requireUser("/dashboard/credits");
  const params = await searchParams;
  const balance = await balanceOf(user.id);
  const product = await getOwnedProduct(user.id);
  const requests = product ? await openRequests(product.id) : 0;
  const ledger = await ledgerFor(user.id);
  const canRequest = Boolean(product?.isPublic && product?.acceptingTestimonials);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Available credits
          </p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-zinc-900">
            {balance}
          </p>

          {params.requested ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
              Request created. Your product is now flagged for reviewers.
            </p>
          ) : null}
          {params.error === "insufficient" ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              You need at least {CREDITS_PER_REQUEST} credit. Review a product in the
              marketplace to earn {CREDITS_PER_REVIEW}.
            </p>
          ) : null}
          {params.error === "unlisted" ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              Your product is not listed in the marketplace, so reviewers cannot find it. List
              it in Product settings before spending a credit.
            </p>
          ) : null}
          {params.error === "paused" ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              Your product is paused, so reviewers cannot submit. Enable accepting testimonials
              before spending a credit.
            </p>
          ) : null}

          <form action={requestTestimonial} className="mt-5">
            <SubmitButton
              disabled={!canRequest || balance < CREDITS_PER_REQUEST}
              pendingLabel="Creating request…"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Request a testimonial · −{CREDITS_PER_REQUEST} credit
            </SubmitButton>
          </form>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            {!product
              ? "Create a product before requesting testimonials."
              : !canRequest
                ? "List and reactivate your product to request a testimonial."
                : requests > 0
                  ? `${requests} open ${requests === 1 ? "request" : "requests"} waiting for a reviewer.`
                  : "Spend 1 credit to put your product in front of reviewers."}
          </p>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
          <h3 className="text-sm font-semibold text-indigo-950">How the ledger works</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-indigo-900/75">
            <li>· +{CREDITS_PER_REVIEW} credits when you submit a marketplace testimonial.</li>
            <li>· −{CREDITS_PER_REQUEST} credit per testimonial request.</li>
            <li>· Credits are earned on a valid submission, not on approval.</li>
            <li>· One testimonial per product per person. No duplicate credits.</li>
            <li>· Every entry references a unique transaction. Balance cannot go negative.</li>
          </ul>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Transaction history</h2>
          <Link href="/explore" className="text-xs font-medium text-indigo-600">
            Earn more →
          </Link>
        </div>

        {ledger.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-zinc-600">No transactions yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Review a product in the marketplace to earn your first{" "}
              {CREDITS_PER_REVIEW} credits.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Entry</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-800">
                        {typeLabels[entry.transactionType] ?? entry.transactionType}
                      </p>
                      {entry.description ? (
                        <p className="mt-0.5 text-[11px] text-zinc-400">{entry.description}</p>
                      ) : null}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold tabular-nums ${
                        entry.amount > 0 ? "text-emerald-600" : "text-zinc-600"
                      }`}
                    >
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-500">
                      {entry.balanceAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
