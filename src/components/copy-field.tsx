"use client";

import { useState } from "react";

export function CopyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      {status === "failed" ? (
        <p className="text-[11px] text-amber-700">
          Clipboard access was blocked. Select the text below and copy it manually.
        </p>
      ) : null}
      {multiline ? (
        <pre className="max-h-32 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] leading-relaxed text-zinc-600 whitespace-pre-wrap break-all">
          {value}
        </pre>
      ) : (
        <div className="truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
          {value}
        </div>
      )}
    </div>
  );
}
