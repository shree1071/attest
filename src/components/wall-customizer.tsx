"use client";

import { useState } from "react";
import { CopyField } from "@/components/copy-field";

const LAYOUTS = [
  { id: "wall", label: "Wall", hint: "Floating masonry cards" },
  { id: "grid", label: "Grid", hint: "Even rows, equal heights" },
  { id: "carousel", label: "Carousel", hint: "Swipeable horizontal row" },
  { id: "badge", label: "Badge", hint: "Compact rating pill" },
  { id: "float", label: "Floating", hint: "Corner bubble (script only)" },
] as const;

type LayoutId = (typeof LAYOUTS)[number]["id"];

const ACCENTS = [
  { id: "#2563eb", label: "Blue" },
  { id: "#4f46e5", label: "Indigo" },
  { id: "#7c3aed", label: "Violet" },
  { id: "#059669", label: "Emerald" },
  { id: "#e11d48", label: "Rose" },
  { id: "#d97706", label: "Amber" },
  { id: "#18181b", label: "Ink" },
];

const LIMITS = [3, 6, 9, 12, 0];

const ANIMATIONS = [
  { id: "up", label: "Fade up" },
  { id: "fade", label: "Fade" },
  { id: "zoom", label: "Zoom" },
  { id: "slide", label: "Slide in" },
  { id: "flip", label: "Flip" },
  { id: "none", label: "None" },
] as const;

type AnimationId = (typeof ANIMATIONS)[number]["id"];

const HEIGHTS: Record<Exclude<LayoutId, "float">, number> = {
  wall: 780,
  grid: 720,
  carousel: 460,
  badge: 96,
};

export function WallCustomizer({
  slug,
  name,
  baseUrl,
}: {
  slug: string;
  name: string;
  baseUrl: string;
}) {
  const [layout, setLayout] = useState<LayoutId>("wall");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("#2563eb");
  const [animation, setAnimation] = useState<AnimationId>("up");
  const [limit, setLimit] = useState(6);

  const queryParams = new URLSearchParams();
  queryParams.set("embed", "1");
  if (layout !== "wall") queryParams.set("layout", layout);
  if (theme !== "light") queryParams.set("theme", theme);
  if (accent !== "#2563eb") queryParams.set("accent", accent);
  if (animation !== "up") queryParams.set("animation", animation);
  if (limit > 0) queryParams.set("limit", String(limit));

  const query = queryParams.toString();
  const previewUrl = `/wall/${slug}?${query}`;
  const absoluteEmbedUrl = `${baseUrl}/wall/${slug}?${query}`;

  const iframeCode =
    layout === "float"
      ? `<script async src="${baseUrl}/widget.js" data-product="${slug}" data-layout="float" data-theme="${theme}" data-accent="${accent}" data-animation="${animation}" data-limit="${limit || 6}"></script>`
      : `<iframe src="${absoluteEmbedUrl}" width="100%" height="${HEIGHTS[layout]}" style="border:0;border-radius:24px;overflow:hidden" loading="lazy" title="${name} testimonials"></iframe>`;

  const scriptCode = `<script async src="${baseUrl}/widget.js" data-product="${slug}" data-layout="${layout}" data-theme="${theme}" data-accent="${accent}" data-animation="${animation}"${limit > 0 ? ` data-limit="${limit}"` : ""}></script>`;

  const activeLayout = LAYOUTS.find((item) => item.id === layout)!;

  return (
    <div className="space-y-4">
      {/* Layout picker */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Layout
        </span>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map((item) => {
            const selected = item.id === layout;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLayout(item.id)}
                aria-pressed={selected}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                } ${item.id === "float" ? "col-span-2" : ""}`}
              >
                <span className="block text-xs font-semibold">{item.label}</span>
                <span
                  className={`block text-[10px] ${selected ? "text-zinc-300" : "text-zinc-500"}`}
                >
                  {item.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme + accent */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Theme
          </span>
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                  theme === option ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Accent
          </span>
          <div className="flex items-center gap-1.5">
            {ACCENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={accent === item.id}
                onClick={() => setAccent(item.id)}
                className={`size-5 rounded-full transition ${
                  accent === item.id
                    ? "ring-2 ring-zinc-900 ring-offset-2"
                    : "ring-1 ring-black/10 hover:scale-110"
                }`}
                style={{ background: item.id }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Show
          </span>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 outline-none focus:border-zinc-900"
          >
            {LIMITS.map((value) => (
              <option key={value} value={value}>
                {value === 0 ? "All testimonials" : `${value} testimonials`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Animation
          </span>
          <select
            value={animation}
            onChange={(event) => setAnimation(event.target.value as AnimationId)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 outline-none focus:border-zinc-900"
          >
            {ANIMATIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[10px] leading-relaxed text-zinc-400">
          Cards animate as they scroll into view. Visitors with reduced-motion enabled see
          them immediately.
        </p>
      </div>

      {/* Live preview */}
      {layout === "float" ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-[11px] leading-relaxed text-zinc-500">
          The floating widget is injected by the script and sits in the bottom-right corner of
          your site as a click-to-open bubble. Copy the script below and open your own site to
          see it in place.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-[#eef1f5]">
          <div className="flex items-center justify-between border-b border-zinc-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-medium text-zinc-500">
            <span>Live preview</span>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="hover:text-zinc-800">
              Open ↗
            </a>
          </div>
          <iframe
            key={`${layout}-${theme}-${accent}-${limit}`}
            src={previewUrl}
            title={`${activeLayout.label} preview`}
            className={`w-full ${layout === "badge" ? "h-24" : "h-64"}`}
          />
        </div>
      )}

      {/* Snippet outputs */}
      <div className="space-y-3">
        {layout === "float" ? (
          <CopyField label="Floating script embed" value={scriptCode} multiline />
        ) : (
          <>
            <CopyField label="Iframe embed" value={iframeCode} multiline />
            <CopyField label="Script embed (no iframe)" value={scriptCode} multiline />
          </>
        )}
      </div>
    </div>
  );
}
