"""The shared contract: every model survives a save/load round trip, and bad data is rejected."""
import pytest
from pydantic import ValidationError

from vault.schema import (DocPage, Measure, Record, Slide, SourceInfo, TranscriptSegment,
                          load_models, save_models)

EXAMPLES = [
    TranscriptSegment(start=0.0, end=4.2, text="Welcome everyone."),
    SourceInfo(source_id="event", file_name="event.mp4", duration=245.3, language="en",
               language_probability=0.98),
    Measure(source_id="event", original_bytes=105_000_000, distilled_bytes=520_000, saved_percent=99.5,
            slide_count=5, breakdown={"transcript.json": 4000, "slides": 500_000}),
    Slide(id="slide-001", source_id="event", start=0.0, end=12.0,
          image_path="data/store/slides/abcd1234abcd1234.jpg", phash="abcd1234abcd1234"),
    DocPage(doc_path="data/input/deck.pdf", doc_name="deck.pdf", page_number=1,
            file_sha256="f" * 64, text="Latency", text_sha256="t" * 64, phash="abcd1234abcd1234",
            image_path="data/output/docs/pages/deck-p001.jpg", metadata={"author": "Ericsson"}),
    Record(id="event-slide-001", source_id="event", slide_id="slide-001", start=0.0, end=12.0,
           spoken_text="Welcome everyone.", slide_text="Agenda",
           image_path="data/store/slides/abcd1234abcd1234.jpg"),
]


@pytest.mark.parametrize("item", EXAMPLES, ids=lambda m: type(m).__name__)
def test_round_trip(tmp_path, item):
    path = tmp_path / "out.json"
    save_models(path, [item, item])
    loaded = load_models(path, type(item))
    assert loaded == [item, item]


def test_bad_data_is_rejected(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text('[{"start": "not a number", "end": 1.0, "text": "hi"}]')
    with pytest.raises(ValidationError):
        load_models(path, TranscriptSegment)
