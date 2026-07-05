"""Idempotent loader: CanonicalSold rows -> Neon.

Re-runs are safe. Facts dedup on the natural key (marketplace_id,
source_listing_id) via ON CONFLICT DO NOTHING. The small dimensions that the
locked schema gives no unique constraint (dim_condition, dim_size) get an
application-level get-or-create with an in-process cache, so a repeat load
reuses existing dim rows instead of duplicating them.
"""
from __future__ import annotations

from dataclasses import dataclass

from psycopg import Connection

from .canonical import CanonicalSold
from .fx import DEFAULT_FX

_FACT_COLUMNS = (
    "piece_id, marketplace_id, condition_id, size_id, source_listing_id, raw_title, "
    "sold_price, currency, sold_price_usd, list_price, markdown_pct, sold_date, "
    "listed_no_earlier_than, listing_type, price_reliability, strata, query_keyword"
)

_FACT_INSERT = (
    f"insert into fact_sold_listing ({_FACT_COLUMNS}) "
    "values (%(piece_id)s, %(marketplace_id)s, %(condition_id)s, %(size_id)s, "
    "%(source_listing_id)s, %(raw_title)s, %(sold_price)s, %(currency)s, "
    "%(sold_price_usd)s, %(list_price)s, %(markdown_pct)s, %(sold_date)s, "
    "%(listed_no_earlier_than)s, %(listing_type)s, %(price_reliability)s, "
    "%(strata)s, %(query_keyword)s) "
    "on conflict (marketplace_id, source_listing_id) do nothing"
)


@dataclass
class LoadStats:
    inserted: int = 0
    skipped_conflict: int = 0

    def __str__(self) -> str:
        return f"inserted={self.inserted} skipped(conflict)={self.skipped_conflict}"


class Loader:
    def __init__(self, conn: Connection, fx: dict[str, float] | None = None):
        self.conn = conn
        self.fx = fx or DEFAULT_FX
        self._marketplaces: dict[str, int] = {}
        self._conditions: dict[tuple[str, str], int] = {}
        self._sizes: dict[str, int] = {}

    # --- reference / dimension helpers -------------------------------------

    def seed_reference(self) -> None:
        with self.conn.cursor() as cur:
            for currency, rate in self.fx.items():
                cur.execute(
                    "insert into fx_rate (currency, usd_per_unit, updated_at) "
                    "values (%s, %s, current_date) on conflict (currency) do nothing",
                    (currency, rate),
                )
        self.conn.commit()

    def marketplace_id(self, name: str) -> int:
        if name in self._marketplaces:
            return self._marketplaces[name]
        with self.conn.cursor() as cur:
            cur.execute(
                "insert into dim_marketplace (name) values (%s) "
                "on conflict (name) do nothing",
                (name,),
            )
            cur.execute("select marketplace_id from dim_marketplace where name = %s", (name,))
            mid = cur.fetchone()[0]
        self._marketplaces[name] = mid
        return mid

    def condition_id(self, source: str, raw: str | None, grade: str) -> int | None:
        if raw is None:
            return None
        key = (source, raw)
        if key in self._conditions:
            return self._conditions[key]
        with self.conn.cursor() as cur:
            cur.execute(
                "select condition_id from dim_condition where source = %s and raw = %s",
                (source, raw),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    "insert into dim_condition (source, raw, grade_norm) "
                    "values (%s, %s, %s) returning condition_id",
                    (source, raw, grade),
                )
                row = cur.fetchone()
        self._conditions[key] = row[0]
        return row[0]

    def size_id(self, raw: str | None, norm: str | None) -> int | None:
        if raw is None:
            return None
        if raw in self._sizes:
            return self._sizes[raw]
        with self.conn.cursor() as cur:
            cur.execute("select size_id from dim_size where raw = %s", (raw,))
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    "insert into dim_size (raw, size_norm) values (%s, %s) returning size_id",
                    (raw, norm),
                )
                row = cur.fetchone()
        self._sizes[raw] = row[0]
        return row[0]

    # --- fact load ----------------------------------------------------------

    def load(self, rows: list[CanonicalSold]) -> LoadStats:
        if not rows:
            return LoadStats()
        # Resolve dimensions first (cached, so only unique dims hit the db), then
        # batch the fact insert. executemany pipelines the round-trips, which
        # matters once the real corpus is thousands of rows rather than hundreds.
        params = [self._fact_params(r) for r in rows]
        with self.conn.cursor() as cur:
            cur.executemany(_FACT_INSERT, params)
            inserted = cur.rowcount if cur.rowcount is not None and cur.rowcount >= 0 else 0
        self.conn.commit()
        return LoadStats(inserted=inserted, skipped_conflict=len(rows) - inserted)

    def _fact_params(self, r: CanonicalSold) -> dict:
        return {
            "piece_id": None,  # entity resolution assigns this in Phase 2
            "marketplace_id": self.marketplace_id(r.marketplace),
            "condition_id": self.condition_id(
                r.condition_source, r.condition_raw, r.condition_grade_norm
            ),
            "size_id": self.size_id(r.size_raw, r.size_norm),
            "source_listing_id": r.source_listing_id,
            "raw_title": r.raw_title,
            "sold_price": r.sold_price,
            "currency": r.currency,
            "sold_price_usd": r.sold_price_usd,
            "list_price": r.list_price,
            "markdown_pct": r.markdown_pct,
            "sold_date": r.sold_date,
            "listed_no_earlier_than": r.listed_no_earlier_than,
            "listing_type": r.listing_type,
            "price_reliability": r.price_reliability,
            "strata": r.strata,
            "query_keyword": r.query_keyword,
        }
