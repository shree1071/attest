import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      className={`${className} grid place-items-center rounded-[10px] bg-zinc-900 text-white shadow-sm`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none">
        <path
          d="M7.5 6.5h4.2v4.2H9.9c0 2.1 1 3.2 3 3.6v2.6c-3.9-.4-5.4-3-5.4-6.5V6.5Z"
          fill="currentColor"
        />
        <path
          d="M13.7 6.5h4.2v4.2h-1.8c0 2.1 1 3.2 3 3.6v2.6c-3.9-.4-5.4-3-5.4-6.5V6.5Z"
          fill="currentColor"
          opacity=".55"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      <span className="text-[17px]">Attest</span>
    </Link>
  );
}
