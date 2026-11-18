import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { LOGO_TYPES, LOGO_DIR } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const match = /^[a-f0-9]{16}\.(png|jpg|webp)$/.exec(key);
  if (!match) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await fs.readFile(path.join(LOGO_DIR, key));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": LOGO_TYPES[match[1] as keyof typeof LOGO_TYPES],
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
