"""eBay adapter.

Every row is a completed sale and eBay carries the only trusted sold date
(`endedAt`), so eBay drives the time-series marts. Numeric fields arrive as
strings and are cast strictly (DQ rule 2): a price that will not cast rejects
the row rather than coercing to 0. Best-offer sales are kept but flagged
(DQ rule 3) so the comps mart can down-weight or exclude them.

Currency: the fixtures are 100% ebay.com / USD. When soldCurrency is absent we
default to USD (the site currency); a currency with no fx rate rejects the row
rather than silently misconverting.
"""
from __future__ import annotations

from .. import conditions, normalize
from ..canonical import BEST_OFFER, RELIABLE, AdapterResult, CanonicalSold, Reject
from .base import Adapter


class EbayAdapter(Adapter):
    marketplace = "ebay"

    def adapt(self, rows: list[dict], query_keyword: str | None = None) -> AdapterResult:
        result = AdapterResult()
        for raw in rows:
            sid = raw.get("itemId")
            if sid is None or str(sid).strip() == "":
                result.rejected.append(Reject(None, "missing itemId"))
                continue
            sid = str(sid)

            currency = raw.get("soldCurrency") or "USD"
            try:
                sold_price = normalize.parse_money(raw.get("soldPrice"))
                sold_price_usd = normalize.to_usd(sold_price, currency, self.fx)
            except ValueError as exc:
                result.rejected.append(Reject(sid, str(exc)))
                continue

            condition_raw = raw.get("condition")

            result.rows.append(
                CanonicalSold(
                    marketplace=self.marketplace,
                    source_listing_id=sid,
                    query_keyword=raw.get("keyword") or query_keyword,
                    raw_title=raw.get("title"),
                    sold_price=sold_price,
                    currency=currency,
                    sold_price_usd=sold_price_usd,
                    list_price=None,      # eBay sold rows carry no ask
                    markdown_pct=None,
                    sold_date=normalize.parse_iso_date(raw.get("endedAt")),  # trusted date
                    listed_no_earlier_than=None,
                    listing_type=raw.get("listingType"),
                    price_reliability=self._reliability(raw),
                    strata=None,
                    condition_source=self.marketplace,
                    condition_raw=condition_raw,
                    condition_grade_norm=conditions.grade(self.marketplace, condition_raw),
                    size_raw=None,        # eBay size lives in the title; Phase 2 extracts
                    size_norm=None,
                    brand_raw=None,       # Phase 2 extracts brand from the title
                    archetype_hint=None,
                )
            )
        return result

    @staticmethod
    def _reliability(raw: dict) -> str:
        best_offer = (
            raw.get("isBestOfferAccepted") is True
            or raw.get("listingType") == "best_offer_accepted"
        )
        return BEST_OFFER if best_offer else RELIABLE
