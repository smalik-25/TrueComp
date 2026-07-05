-- Price level per piece across BOTH marketplaces (undated: level, not time-series).
-- Grades by sample size and falls back to a brand+archetype median when the piece
-- itself is thin, so a two-comp median is never presented as authoritative.
-- A best-offer-excluded median is exposed alongside the all-in median (DQ rule 3).
with resolved as (
    select * from {{ ref('int_sold_enriched') }}
    where piece_id is not null
),

by_piece as (
    select
        piece_id,
        max(brand_norm) as brand_norm,
        max(archetype) as archetype,
        max(model_name) as model_name,
        max(season_code) as season_code,
        count(*) as n_sold,
        count(*) filter (where price_reliability = 'best_offer') as n_best_offer,
        percentile_cont(0.5) within group (order by sold_price_usd) as median_usd,
        percentile_cont(0.1) within group (order by sold_price_usd) as p10_usd,
        percentile_cont(0.9) within group (order by sold_price_usd) as p90_usd,
        percentile_cont(0.5) within group (
            order by sold_price_usd
        ) filter (where price_reliability = 'reliable') as median_usd_reliable
    from resolved
    group by piece_id
),

by_brand_archetype as (
    select
        brand_norm,
        archetype,
        count(*) as ba_n,
        percentile_cont(0.5) within group (order by sold_price_usd) as ba_median_usd
    from resolved
    group by brand_norm, archetype
)

select
    p.piece_id,
    p.brand_norm,
    p.archetype,
    p.model_name,
    p.season_code,
    p.n_sold,
    p.n_best_offer,
    round(p.median_usd::numeric, 2) as median_usd,
    round(p.median_usd_reliable::numeric, 2) as median_usd_reliable,
    round(p.p10_usd::numeric, 2) as p10_usd,
    round(p.p90_usd::numeric, 2) as p90_usd,
    case
        when p.n_sold >= 20 then 'A'
        when p.n_sold >= 8 then 'B'
        when p.n_sold >= 3 then 'C'
        else 'D'
    end as confidence_grade,
    -- recommended list anchors on the piece median once there are >= 3 comps,
    -- otherwise on the broader brand+archetype median.
    round(
        (case when p.n_sold >= 3 then p.median_usd else ba.ba_median_usd end)::numeric, 2
    ) as recommended_list_price,
    case when p.n_sold >= 3 then 'piece' else 'brand_archetype_fallback' end
        as recommended_basis
from by_piece p
left join by_brand_archetype ba
    on ba.brand_norm = p.brand_norm and ba.archetype = p.archetype
