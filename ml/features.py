"""Training frame for the price model, drawn from the resolved sold corpus.

Only rows that entity resolution assigned to a piece are used. Features are the
categorical attributes that survive the anti-corruption boundary; the target is
the USD-normalized sold price.
"""
from __future__ import annotations

import pandas as pd

from ingestion.db import connect

CATEGORICAL = [
    "brand_norm",
    "archetype",
    "model_name",
    "season_code",
    "marketplace",
    "condition_grade",
    "price_reliability",
]
TARGET = "sold_price_usd"

_QUERY = """
select
    f.sold_price_usd::float8 as sold_price_usd,
    f.piece_id,
    b.brand_norm,
    p.archetype,
    p.model_name,
    p.season_code,
    m.name as marketplace,
    c.grade_norm as condition_grade,
    f.price_reliability
from fact_sold_listing f
join dim_marketplace m using (marketplace_id)
join dim_piece p on p.piece_id = f.piece_id
left join dim_brand b on b.brand_id = p.brand_id
left join dim_condition c on c.condition_id = f.condition_id
where f.piece_id is not null
"""


def load_frame() -> pd.DataFrame:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(_QUERY)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=cols)
    for col in CATEGORICAL:
        df[col] = df[col].astype("category")
    return df
