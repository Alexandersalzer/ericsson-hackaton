"""Generate mock backend output for the frontend, in the exact format the machines write.

Run from the repo root:  ./venv/bin/python frontend/mock/make_mock.py

Writes (same layout as data/):
  frontend/mock/output/<source_id>/info.json, transcript.json, slides.json, records.json,
                                   <source_id>.txt, measure.json
  frontend/mock/store/slides/<phash>.jpg

Everything is validated by vault/schema.py, so if the schema changes this script breaks
loudly instead of the UI breaking quietly. Slide images are synthetic (rendered titles),
never real Ericsson material, because this repo is public.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import imagehash
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))
from vault.schema import Measure, Record, Slide, SourceInfo, TranscriptSegment, save_models  # noqa: E402

MOCK = REPO / "frontend" / "mock"
STORE = MOCK / "store" / "slides"

# ---------------------------------------------------------------------------
# Mock meetings: (title, subtitle) per slide with its time range, and what was said.
# ---------------------------------------------------------------------------
MEETINGS = [
    {
        "source_id": "ericsson_talk",
        "file_name": "ericsson_talk.mp4",
        "original_bytes": 105_000_000,  # the real test video is ~105 MB
        "duration": 245.0,
        "language": "en",
        "slides": [
            (0, 38, "Hackathon", "Tech concept challenge"),
            (38, 92, "The problem", "Storage grows every year"),
            (92, 131, "The problem", "Knowledge is locked in video"),
            (131, 214, "Suggested Use Cases", "Meetings, documents, offboarding"),
            (214, 245, "Ericsson logo", "(placeholder image)"),
        ],
        "speech": [
            (0, 9, "Welcome everyone, and thank you for joining the hackathon today."),
            (9, 21, "Over the next twenty-four hours you will build a tech concept for one of our challenges."),
            (21, 37, "This challenge is about data storage, and I think it touches every team at Ericsson."),
            (38, 52, "So what is the problem? We store more data every year, and most of it is never opened again."),
            (52, 70, "Meeting recordings are the biggest part. One hour of video can be one or two gigabytes."),
            (70, 91, "Storage costs money and energy, and it makes it harder to find what actually matters."),
            (92, 108, "The second part of the problem is that the knowledge is locked inside the video."),
            (108, 130, "You cannot search a recording. If you want the one slide about latency, you have to watch it all."),
            (131, 150, "Here are some use cases we suggest. First, turn recorded meetings into text and slide images."),
            (150, 172, "Second, find duplicate documents. The same deck is often stored ten times in different folders."),
            (172, 192, "Third, offboarding. When someone leaves, what in their files is unique and what is a copy?"),
            (192, 213, "Whatever you build, nothing important should be lost. Keep the knowledge, drop the weight."),
            (214, 232, "That is it from me. The mentors are here all day, so come and ask us anything."),
            (232, 245, "Good luck, and have fun."),
        ],
    },
    {
        "source_id": "jury_and_prizes",
        "file_name": "Jury and prizes.mp4",
        "original_bytes": 88_654_139,
        "duration": 312.0,
        "language": "en",
        "slides": [
            (0, 104, "Judging criteria", "Technology, design, business, innovativeness"),
            (104, 210, "Two prizes", "Best technology/design and best business"),
            (210, 312, "Deliverables", "Day 2, 15:30. Five-minute presentation"),
        ],
        "speech": [
            (0, 30, "Let me explain how the jury will judge your work."),
            (30, 70, "You will be judged on technology, design and business, and on how innovative the idea is."),
            (70, 103, "A tech concept is an idea based on digital technology. It does not have to be a finished product."),
            (104, 150, "There are two prizes: one for best technology and design, and one for best business."),
            (150, 209, "The jury has people from BTH and Hyper Island together with Ericsson."),
            (210, 260, "Hand in your work on day two at half past three, in your team folder on the Google Drive."),
            (260, 312, "Slides or a video, five minutes. Keep it short and show what works."),
        ],
    },
    {
        "source_id": "graalvm_aot",
        "file_name": "GraalVMs_Ahead-of-Time_Compilation_(Source).mp4",
        "original_bytes": 220_480_662,
        "duration": 1534.0,
        "language": "en",
        "slides": [
            (0, 412, "Ahead-of-time compilation", "From bytecode to a native executable"),
            (412, 980, "Startup and memory", "Milliseconds instead of seconds"),
            (980, 1534, "Trade-offs", "Build time, reflection, peak performance"),
        ],
        "speech": [
            (0, 200, "Today we look at ahead-of-time compilation, where Java code is compiled before it runs."),
            (200, 411, "The result is a native executable that does not need a JVM to start."),
            (412, 700, "The big win is startup time. A service can be ready in milliseconds."),
            (700, 979, "Memory use also drops, because there is no JIT compiler running next to your code."),
            (980, 1250, "There are trade-offs. Builds take longer, and reflection needs extra configuration."),
            (1250, 1534, "For long-running services the JIT can still reach higher peak performance."),
        ],
    },
]


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """A clean system font if available, Pillow's built-in font otherwise."""
    for path in ("/System/Library/Fonts/Helvetica.ttc", "C:/Windows/Fonts/arial.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def render_slide(title: str, subtitle: str) -> Image.Image:
    """A simple 16:9 slide: dark background, white title, gray subtitle."""
    img = Image.new("RGB", (1280, 720), (24, 24, 28))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 1280, 6], fill=(0, 130, 240))  # thin accent bar at the top
    draw.text((96, 300), title, font=font(84), fill=(255, 255, 255))
    draw.text((96, 410), subtitle, font=font(36), fill=(160, 160, 168))
    return img


def hhmmss(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}"


def build(meeting: dict) -> None:
    sid = meeting["source_id"]
    out = MOCK / "output" / sid
    shutil.rmtree(out, ignore_errors=True)  # re-runnable: overwrite old output
    out.mkdir(parents=True)

    # Machine 1: transcript + info
    transcript = [TranscriptSegment(start=a, end=b, text=t) for a, b, t in meeting["speech"]]
    save_models(out / "transcript.json", transcript)
    info = SourceInfo(source_id=sid, file_name=meeting["file_name"], duration=meeting["duration"],
                      language=meeting["language"], language_probability=0.97)
    (out / "info.json").write_text(info.model_dump_json(indent=2), encoding="utf-8")

    # Machine 2: slides, each image stored once under its perceptual hash
    slides: list[Slide] = []
    for i, (start, end, title, subtitle) in enumerate(meeting["slides"], 1):
        img = render_slide(title, subtitle)
        phash = str(imagehash.phash(img))
        image_path = STORE / f"{phash}.jpg"
        if not image_path.exists():
            img.save(image_path, "JPEG", quality=75)
        slides.append(Slide(id=f"slide-{i:03d}", source_id=sid, start=start, end=end,
                            image_path=f"data/store/slides/{phash}.jpg", phash=phash,
                            ocr_text=f"{title}\n{subtitle}"))
    save_models(out / "slides.json", slides)

    # Machine 4: link speech to slides by segment midpoint, plus the plain-text version
    records, blocks = [], []
    for slide in slides:
        said = [s.text for s in transcript if slide.start <= (s.start + s.end) / 2 < slide.end]
        records.append(Record(id=f"{sid}-{slide.id}", source_id=sid, slide_id=slide.id,
                              start=slide.start, end=slide.end, spoken_text=" ".join(said),
                              slide_text=slide.ocr_text, image_path=slide.image_path))
        blocks.append(f"SLIDE {slide.id.split('-')[1]}   {hhmmss(slide.start)} - {hhmmss(slide.end)}\n"
                      f"IMAGE {Path(slide.image_path).name}\n{' '.join(said)}")
    save_models(out / "records.json", records)
    (out / f"{sid}.txt").write_text("\n\n".join(blocks) + "\n", encoding="utf-8")

    # Machine 8: measure real file sizes of the distilled output
    breakdown = {name: (out / name).stat().st_size
                 for name in ("transcript.json", "records.json", f"{sid}.txt")}
    breakdown["slides"] = sum((REPO / "frontend" / "mock" / "store" / "slides" / Path(s.image_path).name)
                              .stat().st_size for s in slides)
    distilled = sum(breakdown.values())
    original = meeting["original_bytes"]
    measure = Measure(source_id=sid, original_bytes=original, distilled_bytes=distilled,
                      saved_percent=round(100 * (1 - distilled / original), 2),
                      slide_count=len(slides), breakdown=breakdown)
    (out / "measure.json").write_text(measure.model_dump_json(indent=2), encoding="utf-8")
    print(f"[mock] {sid}: {len(slides)} slides, {original / 1e6:.1f} MB -> "
          f"{distilled / 1e6:.2f} MB ({measure.saved_percent}% saved)")


if __name__ == "__main__":
    shutil.rmtree(STORE, ignore_errors=True)
    STORE.mkdir(parents=True)
    for m in MEETINGS:
        build(m)
