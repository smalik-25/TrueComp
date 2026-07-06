from __future__ import annotations

from datetime import date
from decimal import Decimal

from ingestion.adapters.grailed import GrailedAdapter
from ingestion.canonical import RELIABLE


def test_full_shape_all_sold(grailed_rick):
    res = GrailedAdapter().adapt(grailed_rick, query_keyword="rick owens")
    assert len(res.rows) == 50
    assert res.rejected == []
    assert res.skipped == 0
    for r in res.rows:
        assert r.marketplace == "grailed"
        assert r.currency == "USD"
        assert r.sold_price_usd == r.sold_price       # Grailed is USD
        assert r.sold_date is None                     # DQ rule 1
        assert r.price_reliability == RELIABLE
        assert r.source_listing_id.isdigit()


def test_full_shape_known_row(grailed_rick):
    res = GrailedAdapter().adapt(grailed_rick, query_keyword="rick owens")
    row = next(r for r in res.rows if r.source_listing_id == "98699575")
    assert row.raw_title == "SS09 Rick Owens Silver Wax Detroit Cut Denim"
    assert row.sold_price == Decimal("700")
    assert row.list_price == Decimal("750")
    assert row.markdown_pct is not None and 0.06 < row.markdown_pct < 0.07
    assert row.listed_no_earlier_than == date(2026, 6, 15)
    assert row.condition_grade_norm == "excellent"    # "Gently Used"
    assert row.strata == "grailed"
    assert row.archetype_hint == "denim"              # bottoms.denim
    assert row.brand_raw == "Rick Owens"


def test_overview_shape_recovers_id_and_treats_as_sold(grailed_undercover):
    res = GrailedAdapter().adapt(grailed_undercover, query_keyword="undercover")
    assert len(res.rows) == 50
    assert res.rejected == []
    for r in res.rows:
        assert r.source_listing_id.isdigit()          # recovered from url
        assert r.sold_date is None
        assert r.listed_no_earlier_than is None        # no createdAt in overview
        assert r.strata is None
        assert r.archetype_hint is None                # no category in overview


def test_unsold_full_row_is_skipped():
    rows = [{"id": 1, "sold": False, "soldPrice": 100, "price": 120,
             "url": "https://www.grailed.com/listings/1", "title": "x"}]
    res = GrailedAdapter().adapt(rows)
    assert res.rows == []
    assert res.skipped == 1


def test_missing_id_and_url_rejected():
    rows = [{"sold": True, "soldPrice": 100, "title": "no id no url"}]
    res = GrailedAdapter().adapt(rows)
    assert res.rows == []
    assert len(res.rejected) == 1
    assert "source_listing_id" in res.rejected[0].reason


def test_bad_sold_price_rejected_not_zeroed():
    rows = [{"id": 9, "sold": True, "soldPrice": "not-a-number",
             "url": "https://www.grailed.com/listings/9", "title": "x"}]
    res = GrailedAdapter().adapt(rows)
    assert res.rows == []
    assert len(res.rejected) == 1


def test_all_fixture_files_load_clean(grailed_all):
    for name, rows in grailed_all.items():
        res = GrailedAdapter().adapt(rows, query_keyword=name)
        assert res.rejected == [], f"{name} had rejects: {res.rejected}"
        assert len(res.rows) > 0


def test_grailed_captures_cover_photo():
    rows = [{"id": 5, "sold": True, "soldPrice": 400, "title": "Rick Owens Ramones",
             "coverPhoto": "https://media-assets.grailed.com/prd/listing/x.jpg"}]
    res = GrailedAdapter().adapt(rows, "rick owens")
    assert res.rows[0].image_url == "https://media-assets.grailed.com/prd/listing/x.jpg"


def test_grailed_fixture_carries_images(grailed_rick):
    res = GrailedAdapter().adapt(grailed_rick, "rick owens")
    assert any(r.image_url for r in res.rows), "no coverPhoto captured from fixtures"
