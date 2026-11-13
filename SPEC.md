# SPEC: Ericsson Data Storage Optimization (Build X Hackathon 2026)

This file is the single source of truth for the project. Read it fully before planning or writing code.
Build ONE phase at a time. A phase is done only when its acceptance criteria pass on real sample files.

---

## 1. Goal

**Keep all knowledge, at a fraction of the storage.**

Build a tool that frees up storage without losing information:

1. **Storage reduction:** replace heavy video with plain text + one image per slide, and find duplicate documents and slides.
2. **Data activation:** make everything searchable and readable by AI (clean JSON + plain text).

### Principles

- **Data is the new gold: nothing is thrown away.** The distilled output (text + images) must keep all the knowledge in the original.
- **The tool never auto-deletes.** It recommends and archives: it reports what *could* be removed or moved to cheaper storage, and a human decides.
- **Plain formats outlive tools.** Output is plain UTF-8 text, JPG images and JSON, readable without this tool.

Demo journey (what the judges must see working):
> Drop in a meeting video + its PDFs → the system shows "1 GB became 5 MB (99.5% saved)" → search "latency" → see the right slide, what was said about it and the timestamp → see a duplicate report for the PDFs.

---

## 2. Input material (from Ericsson)

Put all input in `data/input/`:

| Type | Example | Notes |
|---|---|---|
| Video | `event.mp4` | Recording of someone presenting slides |
| PDFs | `deck.pdf` | Presentations shown in the video (one PDF page = one slide) |
| Exact duplicates | `deck (1).pdf` | Same file downloaded twice |
| Shared slides | `deckA.pdf`, `deckB.pdf` | Different documents with some identical pages |
| Metadata | inside PDFs | Document number, revision, author, date (may be missing) |

---

## 3. Architecture rules

- Each **machine** is one module in `vault/`. It reads files and writes files. Machines never call each other directly.
- Output goes to `data/output/<source_id>/` where `source_id` is the input filename without extension.
- All structured output is **JSON** (lists of objects) so it is AI-ready.
- All data models live in `vault/schema.py` (pydantic). Every machine uses them. Do not invent new fields without updating schema.py and this spec.
- Every machine runs from the command line: `python -m vault.<machine> <input_path>`.
- `vault/pipeline.py` runs all machines in order for one video + a folder of PDFs.
- Code is simple, commented and uses well-known libraries. Prefer reliable over clever.
- Each machine has one small test in `tests/` using a tiny sample file.
- Machines must be re-runnable: running twice gives the same result and overwrites old output.
- Log progress with clear print/log lines (`[slides] found 42 slide changes`).

---

## 4. Folder structure

```
hackaton/
├─ SPEC.md              this file
├─ CLAUDE.md            short rules for AI tools, points to SPEC.md
├─ README.md            how to install and run
├─ requirements.txt
├─ data/
│  ├─ input/            videos + PDFs
│  ├─ output/<source_id>/   per-source results
│  └─ store/slides/     each unique slide image stored ONCE, named by its hash
├─ vault/
│  ├─ schema.py
│  ├─ transcribe.py     machine 1
│  ├─ slides.py         machine 2
│  ├─ ocr.py            machine 3
│  ├─ link.py           machine 4
│  ├─ docs.py           machine 5
│  ├─ dedup.py          machine 6
│  ├─ match.py          machine 7
│  ├─ measure.py        machine 8
│  ├─ search.py         machine 9
│  └─ pipeline.py
├─ frontend/            Next.js UI (see §7)
│  ├─ app/              pages + route handlers
│  ├─ lib/types.ts      mirror of vault/schema.py
│  └─ mock/             mock data, same layout as data/
└─ tests/
```

---

## 5. Data contract (`vault/schema.py`)

```python
class TranscriptSegment:   # one piece of speech
    start: float           # seconds
    end: float
    text: str

class SourceInfo:          # facts about one video (machine 1, info.json)
    source_id: str
    file_name: str         # "ericsson_talk.mp4"
    duration: float        # seconds
    language: str          # detected language code, "en"
    language_probability: float

class Slide:               # one unique slide captured from a video
    id: str                # "slide-004"
    source_id: str         # which video
    start: float           # first second it is shown
    end: float             # last second it is shown
    image_path: str        # path in data/store/slides/
    phash: str             # perceptual hash (hex)
    ocr_text: str = ""     # text read from the image (machine 3)

class DocPage:             # one page of a PDF
    doc_path: str
    doc_name: str
    page_number: int       # 1-based
    file_sha256: str       # hash of the whole file
    text: str              # extracted text
    text_sha256: str       # hash of normalized text
    phash: str             # perceptual hash of the rendered page image
    image_path: str
    metadata: dict         # doc number, revision, author, date if present

class Record:              # the final AI-ready unit: one slide + what was said
    id: str                # "<source_id>-slide-004"
    source_id: str
    slide_id: str
    start: float
    end: float
    spoken_text: str       # all transcript text during this slide
    slide_text: str        # OCR text
    image_path: str
    matched_doc: str | None = None    # set by machine 7
    matched_page: int | None = None
    match_distance: int | None = None

class Measure:             # storage before vs after (machine 8, measure.json, one object)
    source_id: str
    original_bytes: int    # input video
    distilled_bytes: int   # transcript.json + records.json + <source_id>.txt + slide images
    saved_percent: float   # 0..100
    slide_count: int
    breakdown: dict[str, int]  # bytes per output
```

The frontend mirrors these models in `frontend/lib/types.ts`. Change both in the same commit.

---

## 6. The machines

### Machine 1: Transcribe (`vault/transcribe.py`)
- **Input:** video file
- **Output:** `transcript.json` (list of TranscriptSegment) + `info.json` (one SourceInfo: duration, detected language)
- **How:** faster-whisper, model `base` for development, `small` for the final demo. `device="cpu"`, `compute_type="int8"`. Language auto-detect.
- **Accept when:** running on the sample video prints segments with sensible timestamps and the JSON validates against the schema.

### Machine 2: Capture slides (`vault/slides.py`)
- **Input:** video file
- **Output:** one JPG per slide change in `data/store/slides/<phash>.jpg` + `slides.json` (list of Slide)
- **How:**
  1. Sample 1 frame per second with OpenCV.
  2. Compute the perceptual hash (imagehash.phash) of each frame.
  3. A new slide starts when the Hamming distance to the previous slide's hash is above a threshold (start at 10, tune on real data).
  4. Save the frame in the middle of each stable period, compressed JPG (quality ~75).
  5. If an image with the same hash already exists in the store, reuse it (store once).
- **Accept when:** on the sample video the number of slides is close to the number of slides actually shown (check by eye), with no long gaps and no obvious duplicates.

### Machine 3: OCR (`vault/ocr.py`)
- **Input:** `slides.json`
- **Output:** updates `ocr_text` on each Slide in `slides.json`
- **How:** pytesseract (needs `brew install tesseract`). If install is a problem, skip this machine and use matched PDF text from machine 7 instead.
- **Accept when:** slide titles appear correctly in `ocr_text` for most slides.

### Machine 4: Link (`vault/link.py`)
- **Input:** `transcript.json` + `slides.json`
- **Output:** `records.json` (list of Record) + `<source_id>.txt`
- **How:** for each slide, collect all transcript segments whose midpoint falls between slide.start and slide.end. Pure logic, no AI.
- **`<source_id>.txt`:** a plain-text version of the video that a human can read without any tool. UTF-8, no markup (no Markdown, HTML or JSON). One block per slide, in order, separated by a blank line:
  ```
  SLIDE 004   00:03:12 - 00:04:55
  IMAGE 3c9e1f0a7b2d4e65.jpg
  What was said during this slide, as plain sentences.
  ```
  Timestamps are `HH:MM:SS`. The image is the filename in `data/store/slides/`. Speech before the first slide goes in the first block.
- **Accept when:** every transcript segment belongs to exactly one record, a spot check of 3 records shows the speech matches the slide, and `<source_id>.txt` reads correctly in a plain text editor.

### Machine 5: Read documents (`vault/docs.py`)
- **Input:** a folder of PDFs
- **Output:** `data/output/docs/pages.json` (list of DocPage) + one image per page
- **How:** PyMuPDF (`fitz`). Per page: `get_text()`, render with `get_pixmap()`, compute phash. `file_sha256` with hashlib. `text_sha256` on lowercased, whitespace-collapsed text. Metadata from `doc.metadata` and, if present, a document number pattern on the first page.
- **PowerPoint input (not built yet):** if the input is `.pptx`, convert it to PDF first with LibreOffice: `soffice --headless --convert-to pdf --outdir <dir> <file.pptx>`, then process the PDF as usual. Needs `brew install --cask libreoffice`.
- **Accept when:** page count matches the PDFs and text is readable.

### Machine 6: Find duplicates (`vault/dedup.py`)
- **Input:** `pages.json`
- **Output:** `data/output/docs/duplicates.json` with three groups:
  - `identical_files`: same `file_sha256` (e.g. `deck.pdf` and `deck (1).pdf`)
  - `identical_slides`: same `text_sha256` or phash distance ≤ 4, across different files
  - `near_duplicates`: phash distance 5 to 12 (likely revisions, flag for review, never auto-delete)
- Also output a summary: number of files, unique pages, duplicate pages, MB that could be freed.
- **Accept when:** the known duplicate `(1).pdf` is found, and shared slides between decks are found.

### Machine 7: Match video slides to PDF pages (`vault/match.py`)
- **Input:** `slides.json` + `pages.json`
- **Output:** sets `matched_doc`, `matched_page`, `match_distance` on each Record in `records.json`
- **How:** for each video slide, find the PDF page with the smallest phash distance. Accept a match below a threshold (start at 14, tune). Video frames are noisier than PDF renders, so crop black borders and resize both to the same size before hashing.
- **Accept when:** most slides in the sample video map to the correct PDF page (check 5 by eye).

### Machine 8: Measure (`vault/measure.py`)
- **Input:** a `source_id`
- **Output:** `measure.json` (one Measure, sizes in bytes) + printed table
- **How:** original video size vs. sum of transcript.json + records.json + `<source_id>.txt` + slide images used by this source. The original is reported as "can be archived", never deleted. Report MB before, MB after, % saved. Also report savings from document dedup (from machine 6).
- **Accept when:** numbers are correct (check one by hand).

### Machine 9: Search (`vault/search.py`)
- **Input:** all `records.json` files
- **Output:** `data/output/index.npz` (embeddings) + a function `search(query, k=5) -> list[Record]`
- **How:** sentence-transformers `all-MiniLM-L6-v2`. Embed `spoken_text + slide_text` per record. Cosine similarity with numpy. No vector database needed. Always store the plain text next to the embeddings (embeddings can be rebuilt with a future model, text cannot).
- **Accept when:** searching a topic from the video returns the right slide in the top 3.

---

## 7. UI (`frontend/`, Next.js)

Next.js (App Router) + TypeScript + Tailwind in `frontend/`. Run with `cd frontend && npm run dev`, open http://localhost:3000.

- **No separate API server.** Next.js route handlers read the JSON files in `data/output/` and serve slide images from `data/store/slides/`.
- **Types:** `frontend/lib/types.ts` mirrors `vault/schema.py` field for field.
- **Mock data:** `frontend/mock/` has the same layout as `data/` (`mock/output/<source_id>/`, `mock/store/slides/`). One flag, `DATA_SOURCE=mock|real`, picks the folder. Nothing else in the UI knows which one it reads.
- **Processing:** the UI never processes data itself. The upload route saves the video to `data/input/` and starts the existing machines (`python -m vault.<machine>`) as separate processes with the project venv. A missing or failing machine shows as "not available yet" and the run continues.
- **Design:** white, black, gray, one accent (#0082F0). Max content width 960px. 1px #E5E5E5 borders, no shadows or gradients. Inter. Big savings numbers are the hero.

Screens:

1. **Compress** (`/`): headline, drop zone for a video, a checklist (Transcribing → Capturing slides → Linking → Measuring), then Before → After and "% less storage" as the biggest element, plus "Open meeting".
2. **Meeting** (`/meeting/<source_id>`): the "recreated meeting". Header with name, duration, language, before/after size. Slides in order, each with image, time range and what was said. Sticky slide list on the left (wide screens). Downloads: plain text (`<source_id>.txt`) and AI-ready JSON (`records.json`).
3. **Later** (shown disabled in the top nav): Library of all meetings, Search (machine 9), Duplicates (machine 6).

---

## 8. Phases (build in this order)

| Phase | Machines | Done when |
|---|---|---|
| 1 | Setup + 1 Transcribe + 2 Slides | Both run on a real Ericsson video |
| 2 | 4 Link + 8 Measure | `records.json` exists and % saved is printed |
| 3 | 5 Docs + 6 Dedup | Duplicate report correct on sample PDFs |
| 4 | UI: Compress + Meeting screens | Upload a video, see % saved, read the meeting |
| 5 | 9 Search + UI Search, Duplicates | Search finds the right slide |
| 6 | 7 Match + 3 OCR | Slides linked to PDF pages |
| 7 | `pipeline.py` | One command runs everything end to end |

If time runs out, cut from the bottom. Phases 1 to 4 are the minimum demo.

---

## 9. Not built (pitch roadmap only)

- Speaker identification (WhisperX + pyannote)
- Connectors to SharePoint, OneDrive, Ericsson Play
- Offboarding workflow (scan a leaver's files, delete only proven duplicates); shown as a diagram + mockup
- Revision history (keep latest + differences)
- "Nothing is lost" score (AI-generated questions answered from distilled data only); for the demo, 10 hand-written questions
- RAG chat with sources
- Recreating the video from slides + text + voice
- Access rights and GDPR handling

---

## 10. Team split (suggested)

| Person | Owns |
|---|---|
| A | Machines 1, 2, 4 (video track) |
| B | Machines 5, 6 (document track) |
| C | Machines 7, 3, 9 (matching, OCR, search) |
| Alexander | Machine 8, UI, data strategy, pitch |

Everyone works in their own files and only shares data through `schema.py` and the JSON files.

---

## 11. Requirements

```
faster-whisper
opencv-python
imagehash
Pillow
pymupdf
pydantic
numpy
sentence-transformers
pytesseract      # optional, needs: brew install tesseract
pytest
```
