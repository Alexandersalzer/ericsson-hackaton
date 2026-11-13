import { formatBytes, formatPercent } from "@/lib/format";
import type { Measure } from "@/lib/types";

/**
 * The hero of the demo: the % saved, plus two bars drawn to scale so the
 * difference between Before and After is visible, not just readable.
 */
export function SavingsResult({ measure }: { measure: Measure }) {
  const afterShare = measure.distilled_bytes / measure.original_bytes;
  return (
    <section aria-label="Compression result" className="px-5 py-8 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">Storage saved</p>
      <p className="mt-3 text-hero font-semibold tabular-nums">{formatPercent(measure.saved_percent)}</p>

      <dl className="mt-10 space-y-5">
        <SizeBar label="Before" detail="Video, archived" bytes={measure.original_bytes} share={1} tone="bg-line-strong" />
        <SizeBar
          label="After"
          detail={`Text + ${measure.slide_count} slide ${measure.slide_count === 1 ? "image" : "images"}`}
          bytes={measure.distilled_bytes}
          share={afterShare}
          tone="bg-accent"
        />
      </dl>
    </section>
  );
}

function SizeBar({ label, detail, bytes, share, tone }: { label: string; detail: string; bytes: number; share: number; tone: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <dt>
          <span className="font-medium">{label}</span>
          <span className="ml-2 text-muted">{detail}</span>
        </dt>
        <dd className="font-mono tabular-nums">{formatBytes(bytes)}</dd>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
        {/* At least 4px wide so a 0.1% bar is still visible. */}
        <div className={`h-full rounded-full ${tone}`} style={{ width: `max(4px, ${share * 100}%)` }} />
      </div>
    </div>
  );
}
