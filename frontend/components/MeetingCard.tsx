import Image from "next/image";
import Link from "next/link";
import type { MeetingSummary } from "@/lib/data";
import { formatBytes, formatDuration, formatPercent, meetingTitle } from "@/lib/format";

/** One meeting in the library grid. The whole card links to the meeting view. */
export function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  const { info, measure, thumbnail } = meeting;
  return (
    <Link
      href={`/meeting/${encodeURIComponent(info.source_id)}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-line bg-background transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-video border-b border-line bg-subtle">
        {thumbnail && (
          <Image
            src={`/api/slides/${thumbnail}`}
            alt=""
            fill
            unoptimized // already a small JPG; skip Next's image optimizer
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-medium">{meetingTitle(info.file_name)}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {formatDuration(info.duration)} · {measure ? `${measure.slide_count} slides` : "processing"} ·{" "}
          {info.language.toUpperCase()}
        </p>

        {measure && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="font-mono text-xs text-muted tabular-nums">
              {formatBytes(measure.original_bytes)} → <span className="text-ink">{formatBytes(measure.distilled_bytes)}</span>
            </span>
            <span className="rounded-full bg-subtle px-2 py-0.5 font-mono text-xs font-medium tabular-nums">
              −{formatPercent(measure.saved_percent)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
