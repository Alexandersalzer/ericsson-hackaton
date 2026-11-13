"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { initialSteps, runCompress } from "@/lib/compress";
import { formatBytes } from "@/lib/format";
import type { Measure } from "@/lib/types";
import { DropZone } from "./DropZone";
import { PipelineSteps, type Step } from "./PipelineSteps";
import { SavingsResult } from "./SavingsResult";
import { Button, ButtonLink } from "./ui/Button";

// The panel is a small state machine. Each phase renders one view.
type State =
  | { phase: "idle" }
  | { phase: "selected"; file: File }
  | { phase: "running"; file: File; steps: Step[] }
  | { phase: "done"; file: File; sourceId: string; measure: Measure | null }
  | { phase: "failed"; file: File; message: string };

export function CompressPanel({ isMock }: { isMock: boolean }) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const router = useRouter();

  async function compress(file: File) {
    setState({ phase: "running", file, steps: initialSteps() });
    try {
      const { sourceId } = await runCompress(file, (steps) => setState({ phase: "running", file, steps }));
      const res = await fetch(`/api/meetings/${encodeURIComponent(sourceId)}`);
      const meeting = res.ok ? await res.json() : null;
      setState({ phase: "done", file, sourceId, measure: meeting?.measure ?? null });
      router.refresh(); // re-render the server parts (the library) with the new meeting
    } catch (err) {
      setState({ phase: "failed", file, message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  if (state.phase === "idle") return <DropZone onFile={(file) => setState({ phase: "selected", file })} />;

  const reset = () => setState({ phase: "idle" });

  return (
    // divide-y draws one 1px line between each section, so children need no borders of their own.
    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      <FileHeader file={state.file} phase={state.phase} onRemove={state.phase === "selected" ? reset : undefined} />

      {state.phase === "selected" && (
        <Footer>
          <p className="text-muted">Turns the video into text and slide images. The original is kept.</p>
          <Button onClick={() => compress(state.file)}>Compress</Button>
        </Footer>
      )}

      {state.phase === "running" && <PipelineSteps steps={state.steps} />}

      {state.phase === "done" && (
        <>
          {state.measure ? (
            <SavingsResult measure={state.measure} />
          ) : (
            <p className="px-5 py-8 text-muted">Done. Storage numbers appear once the measure step is available.</p>
          )}
          <Footer>
            <p className="font-mono text-xs text-muted">{isMock ? "Sample result from mock data" : state.sourceId}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>
                Compress another
              </Button>
              <ButtonLink href={`/meeting/${encodeURIComponent(state.sourceId)}`}>Open meeting</ButtonLink>
            </div>
          </Footer>
        </>
      )}

      {state.phase === "failed" && (
        <Footer>
          <p className="text-muted">{state.message}</p>
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
        </Footer>
      )}
    </div>
  );
}

function FileHeader({ file, phase, onRemove }: { file: File; phase: State["phase"]; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-subtle" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="14" height="14" rx="2" />
          <path d="M16 10l6-3v10l-6-3" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{file.name}</p>
        <p className="font-mono text-xs text-muted">{formatBytes(file.size)}</p>
      </div>
      <div className="ml-auto">
        {onRemove ? (
          <Button variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        ) : (
          <StatusPill phase={phase} />
        )}
      </div>
    </div>
  );
}

function StatusPill({ phase }: { phase: State["phase"] }) {
  const label = phase === "running" ? "Processing" : phase === "done" ? "Ready" : phase === "failed" ? "Stopped" : "";
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs">
      <span className={`size-1.5 rounded-full ${phase === "running" ? "animate-pulse bg-accent" : phase === "done" ? "bg-ink" : "bg-faint"}`} />
      {label}
    </span>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-subtle px-5 py-3">
      {children}
    </div>
  );
}
