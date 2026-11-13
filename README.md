# Ericsson Data Vault (Build X Hackathon 2026)

Turn meeting videos and PDFs into compact, searchable, AI-ready data, and find duplicate documents and slides.
Full design: [SPEC.md](SPEC.md). Rules for AI tools: [CLAUDE.md](CLAUDE.md).

## Install (macOS)

```bash
brew install python@3.13 ffmpeg tesseract
git clone <repo-url> hackaton && cd hackaton
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Activate the venv in every new terminal: `source venv/bin/activate` (leave with `deactivate`).

## Run

Put videos and PDFs in `data/input/`. Run every command from the repo root.

| Machine | Command | Output |
|---|---|---|
| 1 Transcribe | `python -m vault.transcribe data/input/event.mp4` | `data/output/event/transcript.json` |
| 2 Slides | `python -m vault.slides data/input/event.mp4` | `data/output/event/slides.json` + `data/store/slides/*.jpg` |
| ... | phases 2 to 7, see SPEC.md §8 | |
| UI | `cd frontend && npm install && npm run dev` | http://localhost:3000 |

## Test

```bash
pytest
```

## Team workflow

- Everyone shares data only through `vault/schema.py` and the JSON files in `data/output/`.
- Changing `vault/schema.py`? Update SPEC.md §5 too and tell the team first.
- Work in your own machine file. Commit small, pull often.
