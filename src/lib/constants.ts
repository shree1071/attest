export const CATEGORIES = [
  "SaaS",
  "AI",
  "Developer tools",
  "Productivity",
  "Marketing",
  "Finance",
  "Community",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
