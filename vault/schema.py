"""The shared data contract. Every machine reads and writes these models.

Do not add or rename fields without updating SPEC.md §5 and telling the team:
other people build their machines against this file in parallel.

Usage in a machine:
    from vault.schema import TranscriptSegment, save_models, load_models
    save_models(out_dir / "transcript.json", segments)
    segments = load_models(out_dir / "transcript.json", TranscriptSegment)
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, TypeVar

from pydantic import BaseModel, TypeAdapter


class TranscriptSegment(BaseModel):
    """One piece of speech. Written by machine 1 (transcribe)."""
    start: float               # seconds from the start of the video
    end: float
    text: str


class SourceInfo(BaseModel):
    """Facts about one source video. Written by machine 1 (transcribe) to info.json."""
    source_id: str
    file_name: str             # original file name, e.g. "ericsson_talk.mp4"
    duration: float            # seconds (faster-whisper info.duration)
    language: str              # detected language code, e.g. "en"
    language_probability: float  # 0..1


class Slide(BaseModel):
    """One unique slide captured from a video. Written by machine 2 (slides)."""
    id: str                    # "slide-004"
    source_id: str             # which video (input filename without extension)
    start: float               # first second it is shown
    end: float                 # last second it is shown
    image_path: str            # path in data/store/slides/, relative to repo root
    phash: str                 # perceptual hash (hex)
    ocr_text: str = ""         # text read from the image (filled by machine 3)


class DocPage(BaseModel):
    """One page of a PDF. Written by machine 5 (docs)."""
    doc_path: str
    doc_name: str
    page_number: int           # 1-based
    file_sha256: str           # hash of the whole file
    text: str                  # extracted text
    text_sha256: str           # hash of normalized text (lowercase, whitespace collapsed)
    phash: str                 # perceptual hash of the rendered page image
    image_path: str
    metadata: dict[str, Any]   # doc number, revision, author, date if present


class Record(BaseModel):
    """The final AI-ready unit: one slide + what was said. Written by machine 4 (link)."""
    id: str                    # "<source_id>-slide-004"
    source_id: str
    slide_id: str
    start: float
    end: float
    spoken_text: str           # all transcript text during this slide
    slide_text: str            # OCR text
    image_path: str
    matched_doc: str | None = None    # set by machine 7 (match)
    matched_page: int | None = None
    match_distance: int | None = None


class Measure(BaseModel):
    """Storage before vs after for one source. Written by machine 8 (measure) to measure.json."""
    source_id: str
    original_bytes: int        # size of the input video
    distilled_bytes: int       # transcript.json + records.json + <source_id>.txt + slide images
    saved_percent: float       # 0..100
    slide_count: int
    breakdown: dict[str, int]  # bytes per output, e.g. {"transcript.json": 1234, "slides": 456789}


# ---------------------------------------------------------------------------
# JSON helpers: every machine writes lists of models the same way.
# ---------------------------------------------------------------------------

M = TypeVar("M", bound=BaseModel)


def save_models(path: str | Path, items: list[BaseModel]) -> None:
    """Write a list of models to a JSON file (pretty-printed, UTF-8). Overwrites old output."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = [item.model_dump() for item in items]
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def load_models(path: str | Path, model: type[M]) -> list[M]:
    """Read a JSON file written by save_models() and validate every item against `model`."""
    raw = Path(path).read_text(encoding="utf-8")
    return TypeAdapter(list[model]).validate_json(raw)
