"""Boundary-level normalization helpers shared by the adapters.

Money parsing is strict on purpose (DQ rule 2): a value that will not cast is
raised, never coerced to 0. Callers turn that into a rejected row.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

_MONEY_STRIP = re.compile(r"[,$£€¥\s]")
_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[^a-z0-9]+")


def parse_money(value) -> Decimal:
    """Cast a price to Decimal. Accepts str/int/float; raises ValueError on junk.

    Never returns 0 as a fallback; an unparseable price is a rejected row.
    """
    if value is None:
        raise ValueError("price is null")
    if isinstance(value, bool):  # bool is an int subclass; refuse it explicitly
        raise ValueError(f"price is a bool: {value!r}")
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, str):
        cleaned = _MONEY_STRIP.sub("", value).strip()
        if cleaned == "":
            raise ValueError("price is empty")
        try:
            return Decimal(cleaned)
        except InvalidOperation as exc:
            raise ValueError(f"price does not cast: {value!r}") from exc
    raise ValueError(f"price has unexpected type {type(value).__name__}: {value!r}")


def to_usd(amount: Decimal, currency: str, fx: dict[str, float]) -> Decimal:
    """Convert to USD via fx (usd_per_unit). Raises if the currency is unknown."""
    if currency not in fx:
        raise ValueError(f"no fx rate for currency {currency!r}")
    return (amount * Decimal(str(fx[currency]))).quantize(Decimal("0.01"))


def parse_iso_date(value) -> date | None:
    """Parse an ISO timestamp/date string to a date. None/empty -> None."""
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    s = str(value).strip()
    if s == "":
        return None
    s = s.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s).date()
    except ValueError:
        # fall back to the leading YYYY-MM-DD if present
        m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
        if m:
            return date.fromisoformat(m.group(1))
        raise ValueError(f"date does not parse: {value!r}")


def norm_brand(raw: str | None) -> str | None:
    if not raw:
        return None
    s = _PUNCT.sub(" ", raw.lower()).strip()
    s = _WS.sub(" ", s)
    return s or None


def norm_size(raw) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip().lower()
    s = _WS.sub(" ", s)
    return s or None


def markdown_pct(list_price: Decimal | None, sold_price: Decimal | None) -> float | None:
    """(list - sold) / list, only when both present and list > 0."""
    if list_price is None or sold_price is None:
        return None
    if list_price <= 0:
        return None
    return float((list_price - sold_price) / list_price)


# Grailed category / categoryPath -> coarse archetype. Overview rows have no
# category, so this returns None there and Phase 2 leans on the title.
_GRAILED_ARCHETYPE = {
    "denim": "denim",
    "bottoms": "bottoms",
    "pants": "pants",
    "footwear": "footwear",
    "tops": "top",
    "outerwear": "outerwear",
    "tailoring": "tailoring",
    "accessories": "accessory",
    "knitwear": "knit",
    "sweaters": "knit",
    "shirts": "shirt",
}


def grailed_archetype(category_path: str | None, category: str | None) -> str | None:
    # categoryPath is dotted from coarse to specific ("bottoms.denim"); prefer
    # the most specific recognized segment, then fall back to the bare category.
    if category_path:
        for tok in reversed([t.lower() for t in str(category_path).split(".")]):
            if tok in _GRAILED_ARCHETYPE:
                return _GRAILED_ARCHETYPE[tok]
    if category and str(category).lower() in _GRAILED_ARCHETYPE:
        return _GRAILED_ARCHETYPE[str(category).lower()]
    return None
