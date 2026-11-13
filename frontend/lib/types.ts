/**
 * TypeScript mirror of vault/schema.py — the shared data contract.
 *
 * These MUST match the pydantic models field for field (same names, snake_case).
 * If vault/schema.py changes, change this file in the same commit.
 *
 * Python -> TypeScript: float/int -> number, str -> string,
 * `X | None = None` -> `X | null`, dict -> Record<string, ...>.
 */

/** One piece of speech. transcript.json = TranscriptSegment[] (machine 1). */
export interface TranscriptSegment {
  start: number; // seconds
  end: number;
  text: string;
}

/** Facts about one source video. info.json (machine 1). */
export interface SourceInfo {
  source_id: string;
  file_name: string; // original file name, e.g. "ericsson_talk.mp4"
  duration: number; // seconds
  language: string; // detected language code, e.g. "en"
  language_probability: number; // 0..1
}

/** One unique slide captured from a video. slides.json = Slide[] (machine 2). */
export interface Slide {
  id: string; // "slide-004"
  source_id: string;
  start: number; // first second it is shown
  end: number; // last second it is shown
  image_path: string; // "data/store/slides/<phash>.jpg", relative to repo root
  phash: string;
  ocr_text: string; // filled by machine 3, "" until then
}

/** One page of a PDF. pages.json = DocPage[] (machine 5). */
export interface DocPage {
  doc_path: string;
  doc_name: string;
  page_number: number; // 1-based
  file_sha256: string;
  text: string;
  text_sha256: string;
  phash: string;
  image_path: string;
  metadata: Record<string, unknown>;
}

/** One slide + what was said. records.json = Record[] (machine 4). */
// Named MeetingRecord in TS because `Record` is a built-in TypeScript type.
export interface MeetingRecord {
  id: string; // "<source_id>-slide-004"
  source_id: string;
  slide_id: string;
  start: number;
  end: number;
  spoken_text: string;
  slide_text: string;
  image_path: string;
  matched_doc: string | null; // set by machine 7
  matched_page: number | null;
  match_distance: number | null;
}

/** Storage before vs after for one source. measure.json (machine 8). */
export interface Measure {
  source_id: string;
  original_bytes: number; // the input video
  distilled_bytes: number; // transcript + records + .txt + slide images
  saved_percent: number; // 0..100
  slide_count: number;
  breakdown: Record<string, number>; // bytes per output, e.g. {"transcript.json": 1234, "slides": 456789}
}
