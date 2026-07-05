"""Arbitrage / mispricing detection: active asks below the sold price level.

Gated and currently inert: it reads fact_active_listing, which stays empty until
an active-listing pull is approved (that pull spends). The logic is ready. An
active ask below a piece's P10 sold price is surfaced and ranked by how far under
the median it sits. It references mart_piece_comps for the level rather than the
model, since on the current corpus the model does not beat that median, and it
only considers pieces with at least three comps so a one-sale median never
triggers a false signal.
"""
from __future__ import annotations

from ingestion.db import connect

_QUERY = """
select
    a.active_id,
    a.piece_id,
    a.source_listing_id,
    a.raw_title,
    a.ask_price_usd::float8 as ask_price_usd,
    c.median_usd::float8 as median_usd,
    c.p10_usd::float8 as p10_usd,
    c.n_sold,
    c.confidence_grade,
    round(
        ((c.median_usd - a.ask_price_usd) / nullif(c.median_usd, 0))::numeric, 3
    ) as discount_vs_median
from fact_active_listing a
join mart_piece_comps c on c.piece_id = a.piece_id
where a.ask_price_usd < c.p10_usd
  and c.n_sold >= 3
order by discount_vs_median desc
"""


def find_signals() -> list[dict]:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(_QUERY)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def main() -> int:
    signals = find_signals()
    print(f"arbitrage signals: {len(signals)}")
    if not signals:
        print(
            "(fact_active_listing is empty until an active-listing pull is "
            "approved; the detector is ready and populates once it is)"
        )
    for s in signals[:20]:
        print(
            f"  piece {s['piece_id']} grade {s['confidence_grade']}: "
            f"ask ${s['ask_price_usd']:.0f} vs median ${s['median_usd']:.0f} "
            f"({float(s['discount_vs_median']) * 100:.0f}% under), n={s['n_sold']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
