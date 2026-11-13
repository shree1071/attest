import { headers } from "next/headers";

export const paths = {
  product: (slug: string) => `/product/${slug}`,
  collect: (slug: string) => `/collect/${slug}`,
  wall: (slug: string) => `/wall/${slug}`,
  embed: (slug: string) => `/wall/${slug}?embed=1`,
};

export async function baseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
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
