import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "./errors";

const MAX_BYTES = 512 * 1024;
const LOGO_DIR = path.join(process.cwd(), ".data", "uploads", "logos");

export const LOGO_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;

type LogoExt = keyof typeof LOGO_TYPES;

function detectImage(buf: Buffer): LogoExt | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpg";
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function saveLogo(file: File): Promise<string> {
  if (file.size === 0) throw new ValidationError("The selected image is empty.");
  if (file.size > MAX_BYTES) {
    throw new ValidationError("Logo must be 512 KB or smaller.");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buf);
  if (!ext) {
    throw new ValidationError("Logo must be a PNG, JPEG or WebP image.");
  }

  await fs.mkdir(LOGO_DIR, { recursive: true });
  const key = `${crypto.randomBytes(8).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(LOGO_DIR, key), buf);
  return key;
}

export function logoUrl(key: string | null): string | null {
  return key ? `/api/logos/${key}` : null;
}
