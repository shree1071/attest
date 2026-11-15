import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  __attestDb?: { sqlite: Database.Database; db: Db };
};

function createDb() {
  const dataDir = process.env.VERCEL
    ? path.join("/tmp", ".data")
    : path.join(process.cwd(), ".data");
  fs.mkdirSync(path.join(dataDir, "uploads", "logos"), { recursive: true });

  const databasePath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(dataDir, "app.db");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  const db = drizzle(sqlite, { schema });
  try {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } catch (err: any) {
    // Prevent concurrent Next.js worker race condition on build
    if (!err?.message?.includes("already exists")) {
      console.warn("[DB Migration Notice]", err?.message);
    }
  }
  return { sqlite, db };
}

const instance = globalForDb.__attestDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__attestDb = instance;

export const sqlite = instance.sqlite;
export const db = instance.db;
