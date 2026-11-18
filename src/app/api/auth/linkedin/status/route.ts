import { NextResponse } from "next/server";
import { linkedinConfigured, redirectUriFor } from "@/lib/linkedin";
import { baseUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Safe diagnostic endpoint for OAuth failures: shows the exact redirect_uri the
 * app will send to LinkedIn and which source produced it. No secrets are
 * returned — client/secret values are never included.
 */
export async function GET() {
  const base = await baseUrl();
  const redirectUri = redirectUriFor(base);

  const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL;
  const overrideRaw = process.env.LINKEDIN_REDIRECT_URI;

  return NextResponse.json(
    {
      configured: linkedinConfigured(),
      redirectUri,
      appBaseUrl: base,
      source: overrideRaw
        ? "LINKEDIN_REDIRECT_URI"
        : appUrlRaw?.trim()
          ? "NEXT_PUBLIC_APP_URL"
          : "request host",
      env: {
        NEXT_PUBLIC_APP_URL: appUrlRaw?.trim() || null,
        LINKEDIN_REDIRECT_URI: overrideRaw?.trim() || null,
        VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
        VERCEL_URL: process.env.VERCEL_URL ?? null,
      },
      registerInLinkedIn: [redirectUri],
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
