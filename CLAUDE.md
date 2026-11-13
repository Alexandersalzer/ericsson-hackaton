# CLAUDE.md

Rules for AI coding tools (and humans) working in this repo.

**Read `SPEC.md` fully before planning or writing code.** It is the single source of truth: goal, machines, data contract, phases.

## Architecture rules

- Each **machine** is one module in `vault/` (e.g. `vault/slides.py`). It reads files and writes files. Machines never import or call each other; they share data only through JSON files.
- Output goes to `data/output/<source_id>/`, where `source_id` is the input filename without extension (`event.mp4` → `event`). Slide images go to `data/store/slides/<phash>.jpg`, stored once.
- All data models live in `vault/schema.py` (pydantic). Use them for every JSON you read or write, via `save_models()` / `load_models()`.
- **Do not change `vault/schema.py` without updating SPEC.md §5 and telling the team.** Other people build against it in parallel.
- All structured output is JSON (lists of objects), so it is AI-ready.
- Every machine runs from the command line: `python -m vault.<machine> <input_path>`, run from the repo root.
- Machines must be re-runnable: running twice gives the same result and overwrites old output. Create output folders with `mkdir(parents=True, exist_ok=True)`.
- Log progress with prefixed lines: `print("[slides] found 42 slide changes")`.
- Each machine has one small test in `tests/test_<machine>.py` using a tiny file from `tests/fixtures/`.

- **Never delete or move user files** (inputs, duplicates, originals). Machines only recommend; a human decides.

## Code style

- Simple, readable, commented. Prefer reliable, well-known libraries over clever code.
- Use `pathlib.Path` for paths. Store paths in JSON relative to the repo root.
- Build one phase at a time (SPEC.md §8). A phase is done only when its acceptance criteria pass on real sample files.

## Environment

- Python 3.13 in `venv/` (`source venv/bin/activate`). Install with `pip install -r requirements.txt`.
- System tools: `ffmpeg`, `tesseract` (`brew install ffmpeg tesseract`).
- Keep `av<19` pinned: av 19 breaks faster-whisper 1.2.1.
