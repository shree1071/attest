import crypto from "node:crypto";

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export function linkedinConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export type PkcePair = { verifier: string; challenge: string };

export function createPkce(): PkcePair {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  challenge: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

export type LinkedInIdentity = {
  subject: string;
  name: string;
  email: string | null;
  picture: string | null;
  profileUrl: string | null;
  provider: "linkedin";
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function exchangeLinkedInCode(params: {
  code: string;
  redirectUri: string;
  verifier: string;
  expectedNonce: string;
}): Promise<LinkedInIdentity> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: params.verifier,
    }),
    cache: "no-store",
  });

  const tokens = (await tokenResponse.json()) as TokenResponse;
  if (!tokenResponse.ok || !tokens.access_token) {
    throw new Error(tokens.error_description || "LinkedIn token exchange failed.");
  }

  if (!tokens.id_token) throw new Error("LinkedIn did not return an ID token.");
  const claims = decodeJwtPayload(tokens.id_token);
  if (!claims) throw new Error("LinkedIn returned an unreadable ID token.");
  const issuer = typeof claims.iss === "string" ? claims.iss : "";
  if (issuer !== "https://www.linkedin.com" && issuer !== "https://www.linkedin.com/oauth") {
    throw new Error("LinkedIn ID token issuer mismatch.");
  }
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(clientId)) throw new Error("LinkedIn ID token audience mismatch.");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) {
    throw new Error("LinkedIn ID token expired.");
  }
  if (claims.nonce !== params.expectedNonce) {
    throw new Error("LinkedIn ID token nonce mismatch.");
  }

  const userinfoResponse = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });
  if (!userinfoResponse.ok) throw new Error("LinkedIn profile request failed.");

  const profile = (await userinfoResponse.json()) as {
    sub?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
    locale?: { country?: string; language?: string };
  };

  if (!profile.sub) throw new Error("LinkedIn did not return a member identifier.");
  if (typeof claims.sub === "string" && claims.sub !== profile.sub) {
    throw new Error("LinkedIn identity mismatch between ID token and profile.");
  }
  const name =
    profile.name?.trim() ||
    [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim();
  if (!name) throw new Error("LinkedIn did not return a display name.");

  return {
    subject: profile.sub,
    name,
    email: profile.email?.toLowerCase() ?? null,
    picture: profile.picture ?? null,
    profileUrl: null,
    provider: "linkedin",
  };
}

export function redirectUriFor(base: string): string {
  return `${base}/api/auth/linkedin/callback`;
}
