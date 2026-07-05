from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from ingestion import conditions, normalize


class TestParseMoney:
    def test_string_price(self):
        assert normalize.parse_money("50.00") == Decimal("50.00")

    def test_thousands_separator(self):
        assert normalize.parse_money("1,234.50") == Decimal("1234.50")

    def test_int_and_float(self):
        assert normalize.parse_money(700) == Decimal("700")
        assert normalize.parse_money(12.5) == Decimal("12.5")

    @pytest.mark.parametrize("bad", [None, "", "  ", "abc", "$", True, False])
    def test_rejects_junk_never_zero(self, bad):
        # DQ rule 2: uncastable prices raise; they are never coerced to 0
        with pytest.raises(ValueError):
            normalize.parse_money(bad)


class TestToUsd:
    def test_usd_identity(self):
        assert normalize.to_usd(Decimal("50"), "USD", {"USD": 1.0}) == Decimal("50.00")

    def test_unknown_currency_raises(self):
        with pytest.raises(ValueError):
            normalize.to_usd(Decimal("50"), "JPY", {"USD": 1.0})


class TestDates:
    def test_iso_timestamp_to_date(self):
        assert normalize.parse_iso_date("2026-07-04T00:00:00.000Z") == date(2026, 7, 4)

    @pytest.mark.parametrize("empty", [None, ""])
    def test_empty_is_none(self, empty):
        assert normalize.parse_iso_date(empty) is None


class TestMarkdown:
    def test_basic(self):
        assert normalize.markdown_pct(Decimal("750"), Decimal("700")) == pytest.approx(0.06667, abs=1e-4)

    def test_missing_or_nonpositive_list(self):
        assert normalize.markdown_pct(None, Decimal("700")) is None
        assert normalize.markdown_pct(Decimal("0"), Decimal("700")) is None


class TestNorms:
    def test_brand(self):
        assert normalize.norm_brand("Rick Owens") == "rick owens"
        assert normalize.norm_brand("Comme des Garcons") == "comme des garcons"
        assert normalize.norm_brand(None) is None

    def test_size(self):
        assert normalize.norm_size("30") == "30"
        assert normalize.norm_size(" L ") == "l"

    def test_grailed_archetype(self):
        assert normalize.grailed_archetype("bottoms.denim", "bottoms") == "denim"
        assert normalize.grailed_archetype(None, None) is None


class TestConditions:
    def test_grailed(self):
        assert conditions.grade("grailed", "Gently Used") == "excellent"
        assert conditions.grade("grailed", "Used") == "good"
        assert conditions.grade("grailed", "Worn") == "fair"
        assert conditions.grade("grailed", "New") == "new"

    def test_ebay(self):
        assert conditions.grade("ebay", "Pre-Owned") == "good"
        assert conditions.grade("ebay", "Brand New") == "new"
        assert conditions.grade("ebay", "New (Other)") == "new"

    def test_unknown_is_unknown_not_crash(self):
        assert conditions.grade("grailed", "Frankenstein") == "unknown"
        assert conditions.grade("ebay", None) == "unknown"
