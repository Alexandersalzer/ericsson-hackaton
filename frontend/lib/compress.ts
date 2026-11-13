/**
 * Client-side entry point for compressing one video.
 *
 * STEP 4 (now): a simulation that walks through the steps and returns the mock
 * meeting "ericsson_talk". STEP 5 replaces the body of runCompress() with a real
 * upload + machine run. The UI only depends on the signature below.
 */
import type { Step } from "@/components/PipelineSteps";

export const STEP_LABELS = ["Transcribing", "Capturing slides", "Linking", "Measuring"] as const;

export function initialSteps(): Step[] {
  return STEP_LABELS.map((label) => ({ label, state: "pending" }));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs the pipeline for `file`, reports progress via `onSteps`, resolves with the source id. */
export async function runCompress(file: File, onSteps: (steps: Step[]) => void): Promise<{ sourceId: string }> {
  void file; // used by the real implementation in step 5
  const steps = initialSteps();
  for (let i = 0; i < steps.length; i++) {
    steps[i] = { ...steps[i], state: "running" };
    onSteps([...steps]);
    await wait(900);
    steps[i] = { ...steps[i], state: "done" };
    onSteps([...steps]);
  }
  return { sourceId: "ericsson_talk" };
}
