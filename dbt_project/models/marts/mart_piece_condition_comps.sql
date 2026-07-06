-- Sold price level per piece AND condition (grade_norm), so a comparison can be
-- like-for-like: a "good" ask is judged against "good" comps, not a pool that
-- blends new and fair. Condition is the dominant price driver on this corpus and
-- is close to fully populated on both sides; size is deliberately left out (only
-- about half of sold rows carry it, and requiring it fragments the pools). Every
-- (piece, grade) cell is kept and graded by sample size; the arbitrage mart is
-- what applies the >=3, dispersion and model-level guards. dispersion (p90/p10)
-- is exposed so a consumer can see how tight the like-for-like pool is.
with resolved as (
    select * from {{ ref('int_sold_clean') }}
    where grade_norm is not null
),

by_piece_condition as (
    select
        piece_id,
        grade_norm,
        max(brand_norm) as brand_norm,
        max(archetype) as archetype,
        max(model_name) as model_name,
        max(season_code) as season_code,
        count(*) as n_sold,
        count(*) filter (where price_reliability = 'best_offer') as n_best_offer,
        percentile_cont(0.5) within group (order by sold_price_usd) as median_usd,
        percentile_cont(0.1) within group (order by sold_price_usd) as p10_usd,
        percentile_cont(0.9) within group (order by sold_price_usd) as p90_usd
    from resolved
    group by piece_id, grade_norm
)

select
    piece_id::text || '|' || grade_norm as piece_condition_key,
    piece_id,
    grade_norm,
    brand_norm,
    archetype,
    model_name,
    season_code,
    n_sold,
    n_best_offer,
    round(median_usd::numeric, 2) as median_usd,
    round(p10_usd::numeric, 2) as p10_usd,
    round(p90_usd::numeric, 2) as p90_usd,
    round((p90_usd / nullif(p10_usd, 0))::numeric, 2) as dispersion,
    case
        when n_sold >= 20 then 'A'
        when n_sold >= 8 then 'B'
        when n_sold >= 3 then 'C'
        else 'D'
    end as confidence_grade
from by_piece_condition
