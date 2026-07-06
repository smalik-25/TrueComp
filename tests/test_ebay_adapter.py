from __future__ import annotations

from datetime import date
from decimal import Decimal

from ingestion.adapters.ebay import EbayAdapter
from ingestion.canonical import BEST_OFFER, RELIABLE


def test_all_rows_cast_clean(ebay_rows):
    res = EbayAdapter().adapt(ebay_rows)
    assert len(res.rows) == 180
    assert res.rejected == []
    for r in res.rows:
        assert r.marketplace == "ebay"
        assert isinstance(r.sold_price, Decimal)
        assert r.sold_price_usd == r.sold_price        # USD fixtures
        assert r.list_price is None                    # eBay has no ask
        assert r.size_raw is None                       # size lives in title
        assert r.brand_raw is None


def test_best_offer_flagging_matches_fixture(ebay_rows):
    res = EbayAdapter().adapt(ebay_rows)
    best = [r for r in res.rows if r.price_reliability == BEST_OFFER]
    assert len(best) == 57                              # 57 of 180 in the sample


def test_trusted_sold_date_parsed(ebay_rows):
    res = EbayAdapter().adapt(ebay_rows)
    assert all(r.sold_date is not None for r in res.rows)
    assert any(isinstance(r.sold_date, date) for r in res.rows)


def test_string_price_cast():
    rows = [{"itemId": "1", "soldPrice": "50.00", "soldCurrency": "USD",
             "endedAt": "2026-07-01T00:00:00.000Z", "condition": "Pre-Owned",
             "listingType": "auction"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows[0].sold_price == Decimal("50.00")
    assert res.rows[0].price_reliability == RELIABLE


def test_bad_price_rejected_not_zeroed():
    rows = [{"itemId": "1", "soldPrice": "N/A", "soldCurrency": "USD",
             "endedAt": "2026-07-01T00:00:00.000Z"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows == []
    assert len(res.rejected) == 1


def test_best_offer_via_listing_type_only():
    rows = [{"itemId": "1", "soldPrice": "50.00", "soldCurrency": "USD",
             "endedAt": "2026-07-01T00:00:00.000Z",
             "isBestOfferAccepted": False, "listingType": "best_offer_accepted"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows[0].price_reliability == BEST_OFFER


def test_missing_item_id_rejected():
    rows = [{"soldPrice": "50.00", "soldCurrency": "USD"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows == []
    assert res.rejected[0].reason == "missing itemId"


def test_unknown_currency_rejected_not_misconverted():
    # USD-only fx: a JPY row rejects rather than being silently taken at 1:1
    rows = [{"itemId": "1", "soldPrice": "5000", "soldCurrency": "JPY",
             "endedAt": "2026-07-01T00:00:00.000Z"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows == []
    assert "fx" in res.rejected[0].reason


def test_ebay_captures_thumbnail():
    rows = [{"itemId": "1", "soldPrice": "50.00", "soldCurrency": "USD",
             "endedAt": "2026-07-01T00:00:00.000Z",
             "thumbnailUrl": "https://i.ebayimg.com/images/g/x/s-l500.webp"}]
    res = EbayAdapter().adapt(rows)
    assert res.rows[0].image_url == "https://i.ebayimg.com/images/g/x/s-l500.webp"


def test_ebay_fixture_carries_images(ebay_rows):
    res = EbayAdapter().adapt(ebay_rows)
    assert any(r.image_url for r in res.rows), "no thumbnailUrl captured from fixtures"
