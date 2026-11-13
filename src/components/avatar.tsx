"use client";

import { useState } from "react";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-zinc-100 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-zinc-100 font-medium text-zinc-600 ring-1 ring-zinc-200"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
