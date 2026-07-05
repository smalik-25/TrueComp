"""Adapter base. One adapter per source; each is an anti-corruption layer that
turns raw source rows into CanonicalSold rows and never leaks a source field."""
from __future__ import annotations

from ..canonical import AdapterResult


class Adapter:
    marketplace: str = ""

    def __init__(self, fx: dict[str, float] | None = None):
        # usd_per_unit per currency; USD is the identity rate.
        self.fx = {"USD": 1.0, **(fx or {})}

    def adapt(self, rows: list[dict], query_keyword: str | None = None) -> AdapterResult:
        raise NotImplementedError
