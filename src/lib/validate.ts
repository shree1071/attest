import { ValidationError } from "./errors";

export const MIN_TESTIMONIAL_LENGTH = 100;
export const MAX_TESTIMONIAL_LENGTH = 5000;

export function text(
  value: unknown,
  opts: { label: string; min: number; max: number },
): string {
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw.replace(/\r\n/g, "\n").trim();
  if (cleaned.length < opts.min) {
    throw new ValidationError(
      `${opts.label} must be at least ${opts.min} characters.`,
    );
  }
  if (cleaned.length > opts.max) {
    throw new ValidationError(
      `${opts.label} must be at most ${opts.max} characters.`,
    );
  }
  return cleaned;
}

export function optionalText(value: unknown, max: number): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (raw.length > max) throw new ValidationError(`Keep this under ${max} characters.`);
  return raw;
}

export function email(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
    throw new ValidationError("Enter a valid email address.");
  }
  return raw;
}

export function httpUrl(value: unknown, label: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError(`${label} must be a full URL, e.g. https://example.com`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError(`${label} must start with http:// or https://`);
  }
  if (parsed.username || parsed.password) {
    throw new ValidationError(`${label} must not include a username or password.`);
  }
  if (!parsed.hostname.includes(".")) {
    throw new ValidationError(`${label} must include a domain name.`);
  }
  return parsed.toString();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function checkbox(value: unknown): boolean {
  return value === "on" || value === "true" || value === "1";
}
