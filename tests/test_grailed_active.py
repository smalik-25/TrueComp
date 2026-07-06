from __future__ import annotations

from datetime import date
from decimal import Decimal

from ingestion.adapters.grailed_active import GrailedActiveAdapter


def test_active_reads_ask_and_skips_sold():
    rows = [
        {"id": 1, "sold": False, "price": 300, "title": "Maison Margiela GAT",
         "designer": "Maison Margiela", "condition": "Gently Used", "size": "42"},
        {"id": 2, "sold": True, "price": 400, "soldPrice": 380, "title": "a sold one"},
    ]
    res = GrailedActiveAdapter().adapt(rows, "maison margiela GAT", date(2026, 7, 5))
    assert len(res.rows) == 1
    assert res.skipped == 1
    r = res.rows[0]
    assert r.ask_price == Decimal("300")
    assert r.ask_price_usd == Decimal("300")
    assert r.snapshot_date == date(2026, 7, 5)
    assert r.brand_raw == "Maison Margiela"
    assert r.marketplace == "grailed"


def test_active_default_snapshot_is_today():
    res = GrailedActiveAdapter().adapt([{"id": 3, "sold": False, "price": 100, "title": "x"}], "kw")
    assert res.rows[0].snapshot_date == date.today()


def test_active_bad_ask_rejected_not_zeroed():
    res = GrailedActiveAdapter().adapt([{"id": 4, "sold": False, "price": "N/A", "title": "x"}])
    assert res.rows == []
    assert len(res.rejected) == 1


def test_active_missing_id_rejected():
    res = GrailedActiveAdapter().adapt([{"sold": False, "price": 100, "title": "no id"}])
    assert res.rows == []
    assert len(res.rejected) == 1
