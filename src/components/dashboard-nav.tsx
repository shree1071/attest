"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/product", label: "Product" },
  { href: "/dashboard/wall", label: "Wall" },
  { href: "/dashboard/credits", label: "Credits" },
];

export function DashboardNav({ pending }: { pending: number }) {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-0">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {item.label}
            {item.href === "/dashboard/inbox" && pending > 0 ? (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
