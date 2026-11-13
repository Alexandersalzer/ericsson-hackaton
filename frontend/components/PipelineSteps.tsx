export type StepState = "pending" | "running" | "done" | "unavailable";

export interface Step {
  label: string; // "Transcribing"
  state: StepState;
}

const STATUS_TEXT: Record<StepState, string> = {
  pending: "Queued",
  running: "Running",
  done: "Done",
  unavailable: "Not available yet",
};

/** The checklist shown while a video is processed. A missing machine is calm, not an error. */
export function PipelineSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="divide-y divide-line">
      {steps.map((step) => (
        <li key={step.label} className="flex h-12 items-center gap-3 px-5">
          <StepIcon state={step.state} />
          <span className={step.state === "running" || step.state === "done" ? "text-ink" : "text-muted"}>
            {step.label}
          </span>
          <span className="ml-auto font-mono text-xs text-muted">{STATUS_TEXT[step.state]}</span>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ state }: { state: StepState }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const;
  if (state === "done")
    return (
      <svg {...common} className="text-ink">
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <path d="M4.75 8.25l2 2 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "running")
    return (
      <svg {...common} className="animate-spin text-accent motion-reduce:animate-none">
        <circle cx="8" cy="8" r="6.5" stroke="var(--color-line)" strokeWidth="1.5" />
        <path d="M8 1.5A6.5 6.5 0 0114.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (state === "unavailable")
    return (
      <svg {...common} className="text-faint">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    );
  return (
    <svg {...common} className="text-line-strong">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
