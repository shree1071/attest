import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createSession, safeNextPath, sign } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeLinkedInCode, linkedinConfigured, redirectUriFor } from "@/lib/linkedin";
import { users } from "@/lib/schema";
import { baseUrl } from "@/lib/urls";

type OAuthCookie = {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  exp: number;
};

function readCookie(raw: string | undefined): OAuthCookie | null {
  if (!raw) return null;
  const separator = raw.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthCookie;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!linkedinConfigured()) {
    return NextResponse.redirect(new URL("/login?error=linkedin_unconfigured", request.url));
  }

  const cookie = readCookie(request.cookies.get("linkedin_oauth")?.value);
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  if (!cookie || !state || state !== cookie.state || !code) {
    return NextResponse.redirect(new URL("/login?error=linkedin_state", request.url));
  }

  try {
    const identity = await exchangeLinkedInCode({
      code,
      redirectUri: redirectUriFor(await baseUrl()),
      verifier: cookie.verifier,
      expectedNonce: cookie.nonce,
    });

    const observedAt = new Date();
    let user = db
      .select()
      .from(users)
      .where(and(eq(users.provider, "linkedin"), eq(users.providerSubject, identity.subject)))
      .get();

    if (!user && identity.email) {
      const byEmail = db.select().from(users).where(eq(users.email, identity.email)).get();
      if (byEmail) {
        if (byEmail.providerSubject && byEmail.providerSubject !== identity.subject) {
          throw new Error("This email is already linked to a different LinkedIn account.");
        }
        user = byEmail;
      }
    }

    if (user) {
      db.update(users)
        .set({
          name: identity.name,
          email: identity.email ?? user.email,
          identitySource: "linkedin",
          provider: "linkedin",
          providerSubject: identity.subject,
          avatarUrl: identity.picture,
          identityObservedAt: observedAt,
        })
        .where(eq(users.id, user.id))
        .run();
    } else {
      const id = crypto.randomUUID();
      db.insert(users)
        .values({
          id,
          email: identity.email,
          name: identity.name,
          identitySource: "linkedin",
          provider: "linkedin",
          providerSubject: identity.subject,
          avatarUrl: identity.picture,
          identityObservedAt: observedAt,
        })
        .run();
      user = db.select().from(users).where(eq(users.id, id)).get()!;
    }

    await createSession(user.id);

    const response = NextResponse.redirect(
      new URL(safeNextPath(cookie.next), request.url),
    );
    response.cookies.delete("linkedin_oauth");
    return response;
  } catch (error) {
    console.error("LinkedIn sign-in failed:", error);
    return NextResponse.redirect(new URL("/login?error=linkedin_failed", request.url));
  }
}
