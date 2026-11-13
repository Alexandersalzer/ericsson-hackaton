// GET /api/slides/<phash>.jpg -> the slide image from <data>/store/slides/
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { SLIDES_DIR } from "@/lib/data";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/slides/[file]">) {
  const { file } = await ctx.params;
  // Only "<hex hash>.jpg" is allowed, so nobody can read other files on disk.
  if (!/^[a-f0-9]+\.jpg$/i.test(file)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(SLIDES_DIR, file));
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        // Images are named by their hash, so the same name always means the same image.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
