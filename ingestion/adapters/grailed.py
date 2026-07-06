"""Grailed adapter.

Handles both fixture shapes (see ADAPTER_MAPPINGS): the full 29-field run export
and the stripped ~10-field overview export. The full shape carries `sold`,
`id`, dates, strata and category; the overview shape carries none of those but
still has a listing url (id recoverable) and a realized soldPrice.

Sold filter:
- Full shape: emit only rows where `sold is True`.
- Overview shape: no `sold` flag exists, but every Grailed run is a soldOnly
  search (SEED_INPUTS) and soldPrice differs from ask on most rows, so overview
  rows are treated as sold. They are re-exported in full when the real corpus is
  pulled. This assumption is intentional and easy to flip to a skip.

Grailed has no trusted sold date (DQ rule 1): sold_date is always null;
createdAt becomes listed_no_earlier_than (a lower bound), null on overview rows.
Grailed prices are USD.
"""
from __future__ import annotations

import re

from .. import conditions, normalize
from ..canonical import RELIABLE, AdapterResult, CanonicalSold, Reject
from .base import Adapter

_LISTING_ID = re.compile(r"/listings/(\d+)")


class GrailedAdapter(Adapter):
    marketplace = "grailed"

    def adapt(self, rows: list[dict], query_keyword: str | None = None) -> AdapterResult:
        result = AdapterResult()
        for raw in rows:
            is_full = "sold" in raw or "id" in raw
            if is_full and raw.get("sold") is not True:
                result.skipped += 1  # unsold row in a full export
                continue

            sid = self._listing_id(raw)
            if sid is None:
                result.rejected.append(Reject(None, "missing source_listing_id (no id or url)"))
                continue

            try:
                sold_price = normalize.parse_money(raw.get("soldPrice"))
                sold_price_usd = normalize.to_usd(sold_price, "USD", self.fx)
            except ValueError as exc:
                result.rejected.append(Reject(sid, str(exc)))
                continue

            list_price = None
            if raw.get("price") is not None:
                try:
                    list_price = normalize.parse_money(raw.get("price"))
                except ValueError:
                    list_price = None  # ask is optional; do not reject the sale

            condition_raw = raw.get("condition")
            size_raw = raw.get("size")

            result.rows.append(
                CanonicalSold(
                    marketplace=self.marketplace,
                    source_listing_id=sid,
                    query_keyword=query_keyword,
                    raw_title=raw.get("title"),
                    sold_price=sold_price,
                    currency="USD",
                    sold_price_usd=sold_price_usd,
                    list_price=list_price,
                    markdown_pct=normalize.markdown_pct(list_price, sold_price),
                    sold_date=None,  # DQ rule 1
                    listed_no_earlier_than=normalize.parse_iso_date(raw.get("createdAt")),
                    listing_type=None,  # Grailed has no auction/best-offer type
                    price_reliability=RELIABLE,
                    strata=raw.get("strata"),
                    condition_source=self.marketplace,
                    condition_raw=condition_raw,
                    condition_grade_norm=conditions.grade(self.marketplace, condition_raw),
                    size_raw=size_raw,
                    size_norm=normalize.norm_size(size_raw),
                    brand_raw=self._brand(raw),
                    archetype_hint=normalize.grailed_archetype(
                        raw.get("categoryPath"), raw.get("category")
                    ),
                    image_url=raw.get("coverPhoto"),
                )
            )
        return result

    @staticmethod
    def _listing_id(raw: dict) -> str | None:
        if raw.get("id") is not None:
            return str(raw["id"])
        url = raw.get("url") or ""
        m = _LISTING_ID.search(url)
        return m.group(1) if m else None

    @staticmethod
    def _brand(raw: dict) -> str | None:
        if raw.get("designer"):
            return raw["designer"]
        designers = raw.get("designers") or []
        if designers and isinstance(designers[0], dict):
            return designers[0].get("name")
        return None
