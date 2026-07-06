-- Sold rows joined to piece, brand, marketplace and condition. One row per sale.
-- piece_id / brand / archetype are null for rows entity resolution left
-- unresolved; the piece-level marts filter those out. grade_norm is the
-- normalized condition (DQ rule 4), carried for the condition-matched comps.
select
    s.sold_id,
    s.piece_id,
    s.condition_id,
    cond.grade_norm,
    s.size_id,
    s.raw_title,
    pc.brand_norm,
    pc.archetype,
    pc.model_name,
    pc.season_code,
    m.marketplace,
    s.sold_price_usd,
    s.list_price,
    s.markdown_pct,
    s.sold_date,
    s.listed_no_earlier_than,
    s.price_reliability,
    s.strata
from {{ ref('stg_sold_listing') }} s
join {{ ref('stg_marketplace') }} m on m.marketplace_id = s.marketplace_id
left join {{ ref('stg_piece') }} pc on pc.piece_id = s.piece_id
left join {{ ref('stg_condition') }} cond on cond.condition_id = s.condition_id
