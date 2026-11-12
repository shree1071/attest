import type { User } from "./schema";

export type IdentitySnapshot = {
  schema_version: 1;
  identity_source: "demo" | "linkedin";
  provider: string | null;
  provider_subject: string | null;
  display_name: string;
  headline: string | null;
  headline_source: "self_reported" | "linkedin" | null;
  profile_url: string | null;
  avatar_url: string | null;
  observed_at: string | null;
  submitted_at: string;
};

export function buildIdentitySnapshot(user: User): IdentitySnapshot {
  return {
    schema_version: 1,
    identity_source: user.identitySource,
    provider: user.provider,
    provider_subject: user.providerSubject,
    display_name: user.name,
    headline: user.headline,
    headline_source: user.headline ? user.headlineSource : null,
    profile_url: user.profileUrl,
    avatar_url: user.avatarUrl,
    observed_at: user.identityObservedAt?.toISOString() ?? null,
    submitted_at: new Date().toISOString(),
  };
}

function asHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("https://") || value.startsWith("http://") ? value : null;
}

export function parseSnapshot(raw: string): IdentitySnapshot {
  try {
    const parsed = JSON.parse(raw) as Partial<IdentitySnapshot> | null;
    if (parsed && typeof parsed === "object" && typeof parsed.display_name === "string") {
      return {
        schema_version: 1,
        identity_source: parsed.identity_source === "linkedin" ? "linkedin" : "demo",
        provider: typeof parsed.provider === "string" ? parsed.provider : null,
        provider_subject:
          typeof parsed.provider_subject === "string" ? parsed.provider_subject : null,
        display_name: parsed.display_name,
        headline: typeof parsed.headline === "string" ? parsed.headline : null,
        headline_source:
          parsed.headline_source === "linkedin" || parsed.headline_source === "self_reported"
            ? parsed.headline_source
            : null,
        profile_url: asHttpUrl(parsed.profile_url),
        avatar_url: asHttpUrl(parsed.avatar_url),
        observed_at: typeof parsed.observed_at === "string" ? parsed.observed_at : null,
        submitted_at: typeof parsed.submitted_at === "string" ? parsed.submitted_at : "",
      };
    }
  } catch {
    // Fall through to a neutral identity rather than taking the whole wall down.
  }
  return {
    schema_version: 1,
    identity_source: "demo",
    provider: null,
    provider_subject: null,
    display_name: "Reviewer",
    headline: null,
    headline_source: null,
    profile_url: null,
    avatar_url: null,
    observed_at: null,
    submitted_at: "",
  };
}

export function identityLabel(source: IdentitySnapshot["identity_source"]): string {
  return source === "linkedin" ? "Signed in with LinkedIn" : "Local demo identity";
}
