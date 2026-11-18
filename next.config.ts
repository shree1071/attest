import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // PGlite ships WASM assets; keep it external so the demo database loads at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
