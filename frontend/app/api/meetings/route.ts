// GET /api/meetings -> all processed meetings (summary only), newest first
import { listMeetings } from "@/lib/data";

export async function GET() {
  return Response.json(await listMeetings());
}
