import { Avatar } from "@/components/avatar";
import { formatDate } from "@/lib/format";
import { identityLabel, type IdentitySnapshot } from "@/lib/identity";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  withdrawn: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export function TestimonialCard({
  content,
  snapshot,
  sourceType,
  submittedAt,
  status,
  footer,
  muted = false,
}: {
  content: string;
  snapshot: IdentitySnapshot;
  sourceType: "customer" | "exchange";
  submittedAt: Date;
  status?: "pending" | "approved" | "rejected" | "withdrawn";
  footer?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <figure
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        muted ? "border-zinc-200/70" : "border-zinc-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
          {sourceType === "exchange" ? "Community exchange" : "Customer"}
        </span>
        {status ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${statusStyles[status]}`}
          >
            {status}
          </span>
        ) : null}
      </div>

      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-zinc-700 whitespace-pre-line">
        {content}
      </blockquote>

      <figcaption className="mt-4 flex items-start gap-3 border-t border-zinc-100 pt-3.5">
        <Avatar name={snapshot.display_name} src={snapshot.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-medium text-zinc-900">
              {snapshot.display_name}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500"
              title={identityLabel(snapshot.identity_source)}
            >
              <span
                className={`size-1.5 rounded-full ${
                  snapshot.identity_source === "linkedin" ? "bg-sky-500" : "bg-zinc-400"
                }`}
              />
              {snapshot.identity_source === "linkedin" ? "Signed in with LinkedIn" : "Demo identity"}
            </span>
          </div>
          {snapshot.headline ? (
            <p className="truncate text-xs text-zinc-500">{snapshot.headline}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-zinc-400">
            {formatDate(submittedAt)}
            {snapshot.profile_url ? (
              <>
                {" · "}
                <a
                  href={snapshot.profile_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-600"
                >
                  Profile
                </a>
              </>
            ) : null}
          </p>
        </div>
      </figcaption>

      {footer ? <div className="mt-3 border-t border-zinc-100 pt-3">{footer}</div> : null}
    </figure>
  );
}
