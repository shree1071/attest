import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath, sign } from "@/lib/auth";
import {
  authorizationUrl,
  createPkce,
  linkedinConfigured,
  redirectUriFor,
} from "@/lib/linkedin";
import { baseUrl } from "@/lib/urls";

export async function GET(request: NextRequest) {
  if (!linkedinConfigured()) {
    return NextResponse.redirect(new URL("/login?error=linkedin_unconfigured", request.url));
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const nonce = crypto.randomBytes(24).toString("base64url");
  const pkce = createPkce();
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const base = await baseUrl();

  const payload = Buffer.from(
    JSON.stringify({ state, nonce, verifier: pkce.verifier, next, exp: Date.now() + 600_000 }),
  ).toString("base64url");

  const response = NextResponse.redirect(
    authorizationUrl({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      redirectUri: redirectUriFor(base),
      state,
      nonce,
      challenge: pkce.challenge,
    }),
  );

  response.cookies.set("linkedin_oauth", `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
