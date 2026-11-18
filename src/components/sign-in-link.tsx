"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Sign-in link that returns the visitor to the page they were on (e.g. a collect
 * page or a public wall) instead of dropping them on the dashboard.
 */
export function SignInLink({
  className,
  children = "Sign in",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const current = query ? `${pathname}?${query}` : pathname;
  const next = pathname && pathname !== "/" ? current : "/dashboard";

  return (
    <Link href={`/login?next=${encodeURIComponent(next)}`} className={className}>
      {children}
    </Link>
  );
}
