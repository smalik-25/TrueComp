"""Canonical row shape emitted by every adapter.

Adapters are the anti-corruption layer: raw source rows go in, CanonicalSold
rows come out, and no source-specific field is allowed past this boundary.
Fields map onto fact_sold_listing plus its dimensions, except `brand_raw` and
`archetype_hint`, which are entity-resolution inputs (Phase 2) rather than
persisted fact columns.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

RELIABLE = "reliable"
BEST_OFFER = "best_offer"


@dataclass(frozen=True)
class CanonicalSold:
    # identity / provenance
    marketplace: str                       # grailed | ebay | yahoo_jp
    source_listing_id: str
    query_keyword: str | None

    # text
    raw_title: str | None

    # money (already USD-normalized via fx)
    sold_price: Decimal
    currency: str
    sold_price_usd: Decimal
    list_price: Decimal | None
    markdown_pct: float | None

    # dates (see DQ rule 1: Grailed has no trusted sold date)
    sold_date: date | None
    listed_no_earlier_than: date | None

    # sale character
    listing_type: str | None
    price_reliability: str                 # RELIABLE | BEST_OFFER
    strata: str | None

    # dimensions (per-source condition, never joined on raw text)
    condition_source: str
    condition_raw: str | None
    condition_grade_norm: str
    size_raw: str | None
    size_norm: str | None

    # entity-resolution inputs (Phase 2), not persisted to a fact column
    brand_raw: str | None = None
    archetype_hint: str | None = None


@dataclass
class Reject:
    source_listing_id: str | None
    reason: str


@dataclass
class AdapterResult:
    rows: list[CanonicalSold] = field(default_factory=list)
    rejected: list[Reject] = field(default_factory=list)
    skipped: int = 0                        # rows intentionally not a sold comp

    @property
    def summary(self) -> str:
        return (
            f"rows={len(self.rows)} rejected={len(self.rejected)} "
            f"skipped={self.skipped}"
        )
