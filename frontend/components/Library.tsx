import { connection } from "next/server";
import { listMeetings } from "@/lib/data";
import { formatBytes } from "@/lib/format";
import { MeetingCard } from "./MeetingCard";

/** Server component: reads all meetings from disk on every request. Wrap in <Suspense>. */
export async function Library() {
  await connection(); // always read fresh from disk, never bake into the build
  const meetings = await listMeetings();
  const saved = meetings.reduce(
    (sum, m) => sum + (m.measure ? m.measure.original_bytes - m.measure.distilled_bytes : 0),
    0,
  );

  return (
    <>
      <LibraryHeader>
        {meetings.length > 0 && (
          <p className="font-mono text-xs text-muted">
            {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"} · {formatBytes(saved)} saved
          </p>
        )}
      </LibraryHeader>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center text-muted">
          No meetings yet. Compress a recording above and it shows up here.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <li key={m.info.source_id} className="flex">
              <MeetingCard meeting={m} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Shown instantly while the library loads (same layout, gray boxes). */
export function LibrarySkeleton() {
  return (
    <>
      <LibraryHeader />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="aspect-video animate-pulse bg-subtle" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 rounded bg-subtle" />
              <div className="h-3 w-1/2 rounded bg-subtle" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function LibraryHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-base font-semibold">Library</h2>
      {children}
    </div>
  );
}
