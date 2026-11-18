import { headers } from "next/headers";

export const paths = {
  product: (slug: string) => `/product/${slug}`,
  collect: (slug: string) => `/collect/${slug}`,
  wall: (slug: string) => `/wall/${slug}`,
  embed: (slug: string) => `/wall/${slug}?embed=1`,
};

function cleanUrl(value: string | undefined): string {
  return value ? value.replace(/^\uFEFF/, "").trim().replace(/\/$/, "") : "";
}

/**
 * The canonical public origin.
 *
 * A hard-coded app URL wins (NEXT_PUBLIC_APP_URL), then the host the request
 * actually arrived on. This keeps OAuth redirects working on whichever domain
 * is opened (vercel.app, custom domain, preview) without an env edit, while
 * LINKEDIN_REDIRECT_URI can still pin one canonical callback.
 */
export async function baseUrl(): Promise<string> {
  const configured = cleanUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function embedSnippet(url: string, title: string): string {
  return `<iframe src="${escapeAttribute(url)}" title="${escapeAttribute(`${title} testimonials`)}" width="100%" height="640" style="border:0;border-radius:12px;overflow:hidden" loading="lazy"></iframe>`;
}
