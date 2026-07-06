"""Grailed active-listing adapter: the sold adapter's mirror for asks.

A soldOnly=False Grailed search returns listings still for sale; the current ask
is `price` (not soldPrice). Sold rows that come back in the same result are
skipped, so this emits only live asks, the arbitrage detector's input. It reuses
the sold adapter's id and brand helpers so the two stay in step.
"""
from __future__ import annotations

from datetime import date

from .. import conditions, normalize
from ..canonical import ActiveResult, CanonicalActive, Reject
from .base import Adapter
from .grailed import GrailedAdapter


class GrailedActiveAdapter(Adapter):
    marketplace = "grailed"

    def adapt(
        self,
        rows: list[dict],
        query_keyword: str | None = None,
        snapshot_date: date | None = None,
    ) -> ActiveResult:
        snap = snapshot_date or date.today()
        result = ActiveResult()
        for raw in rows:
            if raw.get("sold") is True:
                result.skipped += 1  # a sold row is not an active ask
                continue

            sid = GrailedAdapter._listing_id(raw)
            if sid is None:
                result.rejected.append(
                    Reject(None, "missing source_listing_id (no id or url)")
                )
                continue

            try:
                ask = normalize.parse_money(raw.get("price"))
                ask_usd = normalize.to_usd(ask, "USD", self.fx)
            except ValueError as exc:
                result.rejected.append(Reject(sid, str(exc)))
                continue

            result.rows.append(
                CanonicalActive(
                    marketplace=self.marketplace,
                    source_listing_id=sid,
                    query_keyword=query_keyword,
                    raw_title=raw.get("title"),
                    ask_price=ask,
                    currency="USD",
                    ask_price_usd=ask_usd,
                    snapshot_date=snap,
                    condition_source=self.marketplace,
                    condition_raw=raw.get("condition"),
                    condition_grade_norm=conditions.grade(
                        self.marketplace, raw.get("condition")
                    ),
                    size_raw=raw.get("size"),
                    size_norm=normalize.norm_size(raw.get("size")),
                    brand_raw=GrailedAdapter._brand(raw),
                    archetype_hint=normalize.grailed_archetype(
                        raw.get("categoryPath"), raw.get("category")
                    ),
                )
            )
        return result
