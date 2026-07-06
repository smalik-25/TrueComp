"""Apply entity resolution to fact_sold_listing and report match rates.

    python -m resolution.run

Resolves each sold row's raw_title + query_keyword to a piece, assigns
piece_id (null when unresolved), and prints the match / unmatched breakdown that
gate 4 needs before any decision about title embeddings. Idempotent: dim_brand
and dim_piece dedup on their natural keys and piece_id is recomputed each run.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from ingestion.db import connect

from .metrics import GRAIL_BRANDS, model_resolution_rate, overall_rate
from .resolver import Resolution, resolve


@dataclass
class Fact:
    sold_id: int
    marketplace: str
    raw_title: str | None
    query_keyword: str | None


class PieceResolver:
    def __init__(self, conn):
        self.conn = conn
        self._brands: dict[str, int] = {}
        self._pieces: dict[str, int] = {}

    def brand_id(self, display: str, norm: str) -> int:
        if norm in self._brands:
            return self._brands[norm]
        with self.conn.cursor() as cur:
            cur.execute(
                "insert into dim_brand (brand_raw, brand_norm) values (%s, %s) "
                "on conflict (brand_norm) do nothing",
                (display, norm),
            )
            cur.execute("select brand_id from dim_brand where brand_norm = %s", (norm,))
            bid = cur.fetchone()[0]
        self._brands[norm] = bid
        return bid

    def piece_id(self, r: Resolution) -> int:
        if r.canonical_key in self._pieces:
            return self._pieces[r.canonical_key]
        bid = self.brand_id(r.brand_display, r.brand_norm)
        with self.conn.cursor() as cur:
            cur.execute(
                "insert into dim_piece "
                "(brand_id, archetype, model_name, season_code, canonical_key) "
                "values (%s, %s, %s, %s, %s) on conflict (canonical_key) do nothing",
                (bid, r.archetype, r.model_name, r.season_code, r.canonical_key),
            )
            cur.execute(
                "select piece_id from dim_piece where canonical_key = %s", (r.canonical_key,)
            )
            pid = cur.fetchone()[0]
        self._pieces[r.canonical_key] = pid
        return pid


def load_facts(conn) -> list[Fact]:
    with conn.cursor() as cur:
        cur.execute(
            "select f.sold_id, m.name, f.raw_title, f.query_keyword "
            "from fact_sold_listing f join dim_marketplace m using (marketplace_id)"
        )
        return [Fact(*row) for row in cur.fetchall()]


def apply_resolution(conn) -> list[tuple[Fact, Resolution]]:
    facts = load_facts(conn)
    resolver = PieceResolver(conn)
    updates: list[tuple[int | None, int]] = []
    out: list[tuple[Fact, Resolution]] = []
    for f in facts:
        r = resolve(f.raw_title, f.query_keyword)
        pid = resolver.piece_id(r) if r.matched else None
        updates.append((pid, f.sold_id))
        out.append((f, r))
    with conn.cursor() as cur:
        cur.executemany(
            "update fact_sold_listing set piece_id = %s where sold_id = %s", updates
        )
    conn.commit()
    return out


def apply_resolution_active(conn) -> int:
    """Stamp piece_id onto active listings so arbitrage can join them to comps.

    Same resolver as the sold path; active rows are keyed on active_id. Empty and
    a no-op until an active-listing pull has loaded fact_active_listing.
    """
    with conn.cursor() as cur:
        cur.execute("select active_id, raw_title, query_keyword from fact_active_listing")
        rows = cur.fetchall()
    if not rows:
        return 0
    resolver = PieceResolver(conn)
    updates: list[tuple[int | None, int]] = []
    for active_id, raw_title, query_keyword in rows:
        r = resolve(raw_title, query_keyword)
        pid = resolver.piece_id(r) if r.matched else None
        updates.append((pid, active_id))
    with conn.cursor() as cur:
        cur.executemany(
            "update fact_active_listing set piece_id = %s where active_id = %s", updates
        )
    conn.commit()
    return len(rows)


def _rate(n: int, d: int) -> str:
    return f"{n}/{d} ({(100 * n / d):.1f}%)" if d else "0/0"


def report(pairs: list[tuple[Fact, Resolution]], conn) -> None:
    total = len(pairs)
    by_src: dict[str, list[Resolution]] = {}
    for f, r in pairs:
        by_src.setdefault(f.marketplace, []).append(r)

    print(f"\n=== resolution report ({total} sold rows) ===")
    print("confidence:", dict(Counter(r.confidence for _f, r in pairs)))

    for scope, res in [("ALL", [r for _f, r in pairs])] + sorted(by_src.items()):
        n = len(res)
        matched = sum(1 for r in res if r.matched)
        brand = sum(1 for r in res if r.brand_norm)
        arche = sum(1 for r in res if r.archetype)
        model = sum(1 for r in res if r.model_name)
        season = sum(1 for r in res if r.season_code)
        print(f"\n[{scope}] rows={n}")
        print(f"  matched (piece assigned): {_rate(matched, n)}")
        print(f"  brand resolved:           {_rate(brand, n)}")
        print(f"  archetype resolved:       {_rate(arche, n)}")
        print(f"  model resolved:           {_rate(model, n)}")
        print(f"  season resolved:          {_rate(season, n)}")

    with conn.cursor() as cur:
        cur.execute("select count(*) from dim_piece")
        pieces = cur.fetchone()[0]
        cur.execute(
            "select count(*) from (select piece_id from fact_sold_listing "
            "where piece_id is not null group by piece_id "
            "having count(distinct marketplace_id) > 1) t"
        )
        cross = cur.fetchone()[0]
    print(f"\ndistinct pieces: {pieces}   cross-marketplace pieces: {cross}")

    # Grail-set honesty: model-level resolution on the eight reference brands, and
    # how many of their pieces actually clear a cross-marketplace comparison.
    grail_rows = [(r.brand_norm, r.model_name) for _f, r in pairs if r.brand_norm]
    per_brand = model_resolution_rate(grail_rows)
    print("\n=== grail set: model-level resolution ===")
    for brand in sorted(GRAIL_BRANDS):
        m, t = per_brand.get(brand, (0, 0))
        print(f"  {brand:18s} model-resolved {_rate(m, t)}")
    gm, gt = overall_rate(per_brand)
    print(f"  {'overall':18s} model-resolved {_rate(gm, gt)}")

    with conn.cursor() as cur:
        marks = ",".join(["%s"] * len(GRAIL_BRANDS))
        cur.execute(
            "select count(*) from ("
            "  select f.piece_id from fact_sold_listing f "
            "  join dim_piece p on p.piece_id = f.piece_id "
            "  join dim_brand b on b.brand_id = p.brand_id "
            f"  where b.brand_norm in ({marks}) "
            "  group by f.piece_id having count(distinct f.marketplace_id) > 1"
            ") t",
            tuple(sorted(GRAIL_BRANDS)),
        )
        grail_both = cur.fetchone()[0]
    spread = None
    try:
        with conn.cursor() as cur:
            cur.execute("select count(*) from mart_cross_marketplace_spread")
            spread = cur.fetchone()[0]
    except Exception:
        conn.rollback()
    tail = f"   clearing the spread mart: {spread}" if spread is not None else ""
    print(f"\ngrail pieces on >1 marketplace: {grail_both}{tail}")
    print(
        "the gap there, not the resolver, is the bottleneck the corpus expansion "
        "targets: a piece can sell on both sides and still lack the depth a spread "
        "needs (>=3 clean comps each side, medians within 2x)."
    )

    unresolved = [(f, r) for f, r in pairs if not r.matched]
    print(f"\nunmatched sample ({len(unresolved)} rows; brand_only + unresolved):")
    for f, r in unresolved[:15]:
        print(f"  [{r.confidence}] {f.marketplace}: {f.raw_title!r} (kw={f.query_keyword!r})")


def main() -> int:
    with connect() as conn:
        pairs = apply_resolution(conn)
        report(pairs, conn)
        n_active = apply_resolution_active(conn)
        if n_active:
            print(f"\nactive listings resolved: {n_active}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
