#!/usr/bin/env node
/**
 * Start the app against the bundled, seeded demo database instead of Postgres.
 *
 *   npm run dev:demo
 *
 * Demo mode is in-memory: every restart reseeds the data in src/lib/demo-db.ts.
 * It is deliberately explicit — it never replaces a working Postgres connection.
 */
import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, ATTEST_DEMO_DB: "1" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
