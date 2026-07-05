"""Per-source condition maps (DQ rule 4).

The two vocabularies do not align one-to-one, so each source maps into a shared
grade_norm scale but the raw string and source are always kept, and conditions
are never joined across sources on raw text. Unknown vocab grades to 'unknown'
rather than crashing, so a new value never drops a row.
"""
from __future__ import annotations

GRADES = ("new", "excellent", "good", "fair", "unknown")

# keys are lowercased raw condition strings
_GRAILED = {
    "new": "new",
    "new/never worn": "new",
    "never worn": "new",
    "gently used": "excellent",
    "used": "good",
    "worn": "fair",
    "very worn": "fair",
}

_EBAY = {
    "brand new": "new",
    "new": "new",
    "new (other)": "new",
    "new with box": "new",
    "new without box": "new",
    "new with defects": "new",
    "pre-owned": "good",
    "used": "good",
    "certified - refurbished": "excellent",
    "seller refurbished": "good",
    "for parts or not working": "fair",
}

_MAPS = {"grailed": _GRAILED, "ebay": _EBAY}


def grade(source: str, raw: str | None) -> str:
    if raw is None:
        return "unknown"
    return _MAPS.get(source, {}).get(raw.strip().lower(), "unknown")
