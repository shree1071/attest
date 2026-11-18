import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { SqlClient } from "./demo-db";
import { installNeonDnsFallback } from "./neon-dns";
import * as schema from "./schema";

// Installed at module load so a dev-server HMR reload re-applies it even when
// the cached pool below is reused.
installNeonDnsFallback();

export type Db = NodePgDatabase<typeof schema>;

/**
 * The executor type accepted by ledger helpers: either the top-level database
 * handle or an open Drizzle transaction. Both expose the same query builders.
 */
export type DbExecutor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Demo mode is explicit: set ATTEST_DEMO_DB=1 (or run without DATABASE_URL) to
 * serve the bundled, seeded PGlite database. Neon is never silently replaced —
 * if it is unreachable, the real connection error surfaces as before.
 */
const demoMode =
  process.env.ATTEST_DEMO_DB === "1" ||
  process.env.ATTEST_DEMO_DB === "true" ||
  !process.env.DATABASE_URL?.trim();

const globalForDb = globalThis as unknown as {
  __attestPool?: Pool | DemoPool;
  __attestDb?: Db;
};

/**
 * `pg.Pool`-shaped handle over the in-memory PGlite demo database. PGlite is
 * imported lazily so it never loads on the Postgres path.
 */
class DemoPool {
  private clientPromise?: Promise<SqlClient>;

  private client(): Promise<SqlClient> {
    this.clientPromise ??= import("./demo-db").then((module) => module.getDemoClient());
    return this.clientPromise;
  }

  async connect(): Promise<SqlClient> {
    return this.client();
  }

  async query(config: unknown, params?: unknown[]) {
    const client = await this.client();
    return client.query(config, params);
  }

  on() {
    return this;
  }

  async end(): Promise<void> {
    // In-memory backend; nothing to close.
  }
}

function createDb() {
  if (demoMode) {
    console.info(
      "[db] Demo database mode (PGlite, in-memory, seeded). Data resets when the server restarts. Unset ATTEST_DEMO_DB to use Postgres.",
    );
    const pool = new DemoPool();
    const db = drizzle(pool as unknown as Pool, { schema });
    return { pool, db };
  }

  installNeonDnsFallback();

  // Neon recommends the pooled connection string for application traffic.
  // A small pool is enough for Next.js server actions and route handlers.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!.trim(),
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // On Vercel, let Fluid compute reuse the pool across invocations and avoid
  // leaking connections when an invocation finishes.
  if (process.env.VERCEL) {
    attachDatabasePool(pool);
  }

  const db = drizzle(pool, { schema });
  return { pool, db };
}

const instance = globalForDb.__attestDb
  ? { pool: globalForDb.__attestPool!, db: globalForDb.__attestDb }
  : createDb();

// Reuse across hot reloads in development and across Fluid invocations in production.
globalForDb.__attestPool = instance.pool;
globalForDb.__attestDb = instance.db;

export const pool = instance.pool;
export const db = instance.db;
