import { Avatar } from "@/components/avatar";
import { formatDate } from "@/lib/format";
import { identityLabel, type IdentitySnapshot } from "@/lib/identity";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  withdrawn: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

function Stars({
  rating,
  theme,
  size = "sm",
}: {
  rating: number;
  theme: "light" | "dark";
  size?: "sm" | "md";
}) {
  const isDark = theme === "dark";
  return (
    <div
      className={`flex items-center gap-0.5 text-amber-400 ${size === "md" ? "gap-1" : ""}`}
      title={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${size === "md" ? "size-[18px]" : "size-3.5"} ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : isDark
                ? "fill-zinc-800 text-zinc-800"
                : "fill-zinc-200 text-zinc-200"
          }`}
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

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
  variant = "panel",
  accent = "#2563eb",
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
  /** "wall" is the floating, borderless card used on public walls and embeds. */
  variant?: "panel" | "wall";
  accent?: string;
}) {
  const isDark = theme === "dark";

  if (variant === "wall") {
    return (
      <figure
        className={`flex h-full flex-col rounded-[26px] p-6 transition duration-200 sm:p-7 ${
          isDark
            ? "bg-zinc-900 text-zinc-100 ring-1 ring-white/5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)]"
            : "bg-white text-zinc-900 ring-1 ring-black/[0.04] shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)]"
        }`}
      >
        <Stars rating={rating} theme={theme} size="md" />

        <blockquote
          className={`mt-4 flex-1 text-[16.5px] leading-[1.65] tracking-[-0.005em] whitespace-pre-line sm:text-[17px] ${
            isDark ? "text-zinc-200" : "text-zinc-700"
          }`}
        >
          <span className={isDark ? "text-zinc-500" : "text-zinc-300"}>“</span>
          {content}
          <span className={isDark ? "text-zinc-500" : "text-zinc-300"}>”</span>
        </blockquote>

        <figcaption className="mt-6 flex items-center gap-3">
          <Avatar name={snapshot.display_name} src={snapshot.avatar_url} size={44} accent={accent} />
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
              {snapshot.display_name}
            </p>
            <p className={`truncate text-[13px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {snapshot.headline ??
                (sourceType === "exchange" ? "Community exchange" : "Verified customer")}
            </p>
            {snapshot.identity_source === "linkedin" ? (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-sky-600">
                <svg viewBox="0 0 20 20" className="size-3 fill-current" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified via LinkedIn
              </p>
            ) : null}
          </div>
        </figcaption>

        {footer ? (
          <div className={`mt-4 border-t pt-3 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
            {footer}
          </div>
        ) : null}
      </figure>
    );
  }

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

        <Stars rating={rating} theme={theme} />
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
