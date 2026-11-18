// Diagnostic: verifies whether the local LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
// pair is accepted by LinkedIn. Sends a deliberately invalid authorization code.
// Interpreting the result:
//   error=invalid_client  -> the client ID/secret pair is wrong (secret mistyped or rotated)
//   error=invalid_grant / invalid_request -> credentials are OK; the problem is elsewhere
// The secret is never printed.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const clean = (v) => (v ?? "").replace(/^\uFEFF/, "").trim();
const clientId = clean(process.env.LINKEDIN_CLIENT_ID);
const clientSecret = clean(process.env.LINKEDIN_CLIENT_SECRET);

if (!clientId || !clientSecret) {
  console.error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env.local");
  process.exit(1);
}

console.log(`client_id: ${clientId}`);
console.log(`secret length: ${clientSecret.length} (expected 32-40 chars)`);
console.log(`secret has whitespace/quotes: ${/[\s"']/.test(process.env.LINKEDIN_CLIENT_SECRET ?? "")}`);

const redirectUri =
  (clean(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000") +
  "/api/auth/linkedin/callback";

const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: "DIAGNOSTIC-INVALID-CODE",
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  }),
  signal: AbortSignal.timeout(20000),
});

const body = await response.json().catch(() => ({}));
console.log(`HTTP ${response.status} -> error=${body.error} description=${body.error_description}`);
