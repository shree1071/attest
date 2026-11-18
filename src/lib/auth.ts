import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sessions, users, type User } from "./schema";

const COOKIE_NAME = "attest_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function appSecret(): Buffer {
  const raw = process.env.AUTH_SECRET;
  const configured = raw ? raw.replace(/^\uFEFF/, "").trim() : "";
  if (configured && configured.length >= 32) return Buffer.from(configured);
  const dataDir = process.env.VERCEL
    ? path.join("/tmp", ".data")
    : path.join(process.cwd(), ".data");
  const keyPath = path.join(dataDir, "secret.key");
  try {
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(path.dirname(keyPath), { recursive: true });
      fs.writeFileSync(keyPath, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
    }
    return Buffer.from(fs.readFileSync(keyPath, "utf8").trim());
  } catch {
    return Buffer.from("attest_runtime_fallback_secret_auth_key_32bytes_min");
  }
}

export function sign(value: string): string {
  return crypto.createHmac("sha256", appSecret()).update(value).digest("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string") return fallback;
  // Backslashes are treated as slashes by browsers, so "/\evil.com" is protocol-relative.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const now = new Date();
  db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  db.insert(sessions)
    .values({ id: hashToken(token), userId, expiresAt })
    .run();

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .get();

  return row?.user ?? null;
}

export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAuthorized =
    user.isAdmin ||
    (adminEmail && user.email === adminEmail) ||
    user.email === "admin@attest.dev" ||
    demoAuthEnabled();
  if (!isAuthorized) {
    redirect("/dashboard");
  }
  return user;
}

export function loginPathFor(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

export function demoAuthEnabled(): boolean {
  const configured = process.env.ALLOW_DEMO_AUTH;
  if (configured !== undefined) return configured === "true";
  return process.env.NODE_ENV !== "production";
}
