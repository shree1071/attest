import path from "node:path";
import { installNeonDnsFallback } from "../src/lib/neon-dns";

installNeonDnsFallback();

// Migrations should use the direct (non-pooled) endpoint.
if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
}

const { migrate } = await import("drizzle-orm/node-postgres/migrator");
const { db, pool } = await import("../src/lib/db");

try {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
