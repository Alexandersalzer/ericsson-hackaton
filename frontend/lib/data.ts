/**
 * The ONLY place that knows where data lives. Pages and route handlers call these
 * functions and never touch the file system themselves.
 *
 * DATA_SOURCE=mock (default) reads frontend/mock/, DATA_SOURCE=real reads ../data/.
 * Both folders have the same layout, so the code path is identical.
 */
import "server-only";

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Measure, MeetingRecord, Slide, SourceInfo, TranscriptSegment } from "./types";

export const DATA_SOURCE = process.env.DATA_SOURCE === "real" ? "real" : "mock";

const ROOT =
  DATA_SOURCE === "real"
    ? path.resolve(process.cwd(), "..", "data") // repo-root/data
    : path.resolve(process.cwd(), "mock"); // frontend/mock

const OUTPUT_DIR = path.join(ROOT, "output");
export const SLIDES_DIR = path.join(ROOT, "store", "slides");

/** What the library list needs per meeting. */
export interface MeetingSummary {
  info: SourceInfo;
  measure: Measure | null; // null until machine 8 has run
  thumbnail: string | null; // image file name of the first slide
}

/** Everything the meeting view needs. Missing files become empty lists / null. */
export interface Meeting extends MeetingSummary {
  slides: Slide[];
  records: MeetingRecord[];
  transcript: TranscriptSegment[];
}

/** Source ids come from URLs, so only allow safe characters (blocks "../" tricks). */
export function isSafeId(id: string): boolean {
  return /^[\w.\- ]+$/.test(id) && !id.includes("..");
}

/** Read and parse a JSON file, or return `fallback` if it does not exist yet. */
async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

/** File name only: "data/store/slides/abc.jpg" -> "abc.jpg". */
export function imageName(imagePath: string): string {
  return path.basename(imagePath);
}

async function readSummary(sourceId: string): Promise<MeetingSummary | null> {
  const dir = path.join(OUTPUT_DIR, sourceId);
  const info = await readJson<SourceInfo | null>(path.join(dir, "info.json"), null);
  if (!info) return null; // not a meeting folder (e.g. output/docs/) or machine 1 not done
  const measure = await readJson<Measure | null>(path.join(dir, "measure.json"), null);
  const slides = await readJson<Slide[]>(path.join(dir, "slides.json"), []);
  return { info, measure, thumbnail: slides[0] ? imageName(slides[0].image_path) : null };
}

/** All processed meetings, newest first. */
export async function listMeetings(): Promise<MeetingSummary[]> {
  let names: string[];
  try {
    names = await readdir(OUTPUT_DIR);
  } catch {
    return []; // no output folder yet
  }
  const withTimes = await Promise.all(
    names.filter(isSafeId).map(async (name) => {
      const summary = await readSummary(name);
      if (!summary) return null;
      const { mtimeMs } = await stat(path.join(OUTPUT_DIR, name));
      return { summary, mtimeMs };
    }),
  );
  return withTimes
    .filter((x) => x !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((x) => x.summary);
}

/** One meeting with all its parts, or null if it does not exist. */
export async function getMeeting(sourceId: string): Promise<Meeting | null> {
  if (!isSafeId(sourceId)) return null;
  const summary = await readSummary(sourceId);
  if (!summary) return null;
  const dir = path.join(OUTPUT_DIR, sourceId);
  const [slides, records, transcript] = await Promise.all([
    readJson<Slide[]>(path.join(dir, "slides.json"), []),
    readJson<MeetingRecord[]>(path.join(dir, "records.json"), []),
    readJson<TranscriptSegment[]>(path.join(dir, "transcript.json"), []),
  ]);
  return { ...summary, slides, records, transcript };
}
