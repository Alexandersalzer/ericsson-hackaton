// GET /api/meetings/<sourceId> -> one meeting with slides, records and transcript
import type { NextRequest } from "next/server";
import { getMeeting } from "@/lib/data";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/meetings/[sourceId]">) {
  const { sourceId } = await ctx.params;
  // Real source ids can contain spaces ("Jury and prizes"), which arrive as %20.
  let id = sourceId;
  try {
    id = decodeURIComponent(sourceId);
  } catch {}
  const meeting = await getMeeting(id);
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });
  return Response.json(meeting);
}
