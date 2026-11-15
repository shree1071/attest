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
  rating = 5,
  theme = "light",
  footer,
  muted = false,
}: {
  content: string;
  snapshot: IdentitySnapshot;
  sourceType: "customer" | "exchange";
  submittedAt: Date;
  status?: "pending" | "approved" | "rejected" | "withdrawn";
  rating?: number;
  theme?: "light" | "dark";
  footer?: React.ReactNode;
  muted?: boolean;
}) {
  const isDark = theme === "dark";

  return (
    <figure
      className={`flex h-full flex-col rounded-2xl border p-5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        isDark
          ? "border-zinc-800 bg-zinc-900 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          : muted
            ? "border-zinc-200/70 bg-white text-zinc-900"
            : "border-zinc-200 bg-white text-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
            }`}
          >
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

        {/* 5-star rating display */}
        <div className="flex items-center gap-0.5 text-amber-400" title={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`size-3.5 ${
                i < (rating ?? 5)
                  ? "fill-amber-400 text-amber-400"
                  : isDark
                    ? "fill-zinc-800 text-zinc-800"
                    : "fill-zinc-200 text-zinc-200"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      <blockquote
        className={`mt-3 flex-1 text-[15px] leading-relaxed whitespace-pre-line ${
          isDark ? "text-zinc-300" : "text-zinc-700"
        }`}
      >
        {content}
      </blockquote>

      <figcaption
        className={`mt-4 flex items-start gap-3 border-t pt-3.5 ${
          isDark ? "border-zinc-800" : "border-zinc-100"
        }`}
      >
        <Avatar name={snapshot.display_name} src={snapshot.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`truncate text-sm font-medium ${
                isDark ? "text-zinc-100" : "text-zinc-900"
              }`}
            >
              {snapshot.display_name}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
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
            <p className={`truncate text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {snapshot.headline}
            </p>
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
                  className={`underline underline-offset-2 ${
                    isDark
                      ? "decoration-zinc-700 hover:text-zinc-200"
                      : "decoration-zinc-300 hover:text-zinc-600"
                  }`}
                >
                  Profile
                </a>
              </>
            ) : null}
          </p>
        </div>
      </figcaption>

      {footer ? (
        <div className={`mt-3 border-t pt-3 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
          {footer}
        </div>
      ) : null}
    </figure>
  );
}
