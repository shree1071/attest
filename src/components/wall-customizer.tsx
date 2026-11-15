"use client";

import { useState } from "react";
import { CopyField } from "@/components/copy-field";

export function WallCustomizer({
  slug,
  name,
  baseUrl,
}: {
  slug: string;
  name: string;
  baseUrl: string;
}) {
  const [layout, setLayout] = useState<"masonry" | "carousel" | "badge">("masonry");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const queryParams = new URLSearchParams();
  queryParams.set("embed", "1");
  if (layout !== "masonry") queryParams.set("layout", layout);
  if (theme !== "light") queryParams.set("theme", theme);

  const previewUrl = `/wall/${slug}?${queryParams.toString()}`;
  const absoluteEmbedUrl = `${baseUrl}/wall/${slug}?${queryParams.toString()}`;

  const iframeCode =
    layout === "badge"
      ? `<iframe src="${absoluteEmbedUrl}" width="100%" height="60" frameborder="0" scrolling="no" title="${name} badge"></iframe>`
      : layout === "carousel"
        ? `<iframe src="${absoluteEmbedUrl}" width="100%" height="320" frameborder="0" scrolling="no" title="${name} carousel"></iframe>`
        : `<iframe src="${absoluteEmbedUrl}" width="100%" height="600" frameborder="0" scrolling="no" title="${name} wall of love"></iframe>`;

  const scriptCode = `<script async src="${baseUrl}/widget.js" data-product="${slug}" data-theme="${theme}"></script>`;

  return (
    <div className="space-y-4">
      {/* Configuration Controls */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-zinc-600">Widget Style</span>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as any)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-zinc-900"
          >
            <option value="masonry">Wall of Love (Masonry)</option>
            <option value="carousel">Horizontal Slider (Carousel)</option>
            <option value="badge">Compact Social Proof Badge</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-zinc-600">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-zinc-900"
          >
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
          </select>
        </label>
      </div>

      {/* Snippet Outputs */}
      <div className="space-y-3">
        <CopyField label="Iframe Embed Code" value={iframeCode} multiline />
        <CopyField label="Static Script Embed" value={scriptCode} multiline />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400"
        >
          Preview customized widget ↗
        </a>
      </div>
    </div>
  );
}
