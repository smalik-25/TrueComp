-- Per piece, the median sold price on each marketplace and the spread between
-- them. Hardened so it does not report comparisons it cannot stand behind:
--   * only model-level pieces (model_name resolved) qualify, because a coarse
--     brand+archetype bucket is not one object;
--   * both sides need at least min_spread_comps cleaned comps;
--   * the two medians must sit within spread_ratio_cap of each other (symmetric
--     in both directions) -- a wider same-piece gap means contamination (fakes or
--     a mis-grouped item), so the row is dropped rather than surfaced as a real
--     market gap. grailed_n / ebay_n are exposed so a thin comparison is visible.
-- Model-level is necessary but not sufficient for "one object"; the upstream
-- resolver's title-only model matching does the rest. Pieces dropped by the cap
-- are not surfaced here; the companion singular test only guards the invariant.
with by_piece_marketplace as (
    select
        piece_id,
        model_name,
        marketplace,
        count(*) as n,
        percentile_cont(0.5) within group (order by sold_price_usd) as median_usd
    from {{ ref('int_sold_clean') }}
    where model_name is not null
    group by piece_id, model_name, marketplace
),

pivoted as (
    select
        piece_id,
        max(model_name) as model_name,
        max(median_usd) filter (where marketplace = 'grailed') as grailed_median,
        max(median_usd) filter (where marketplace = 'ebay') as ebay_median,
        max(n) filter (where marketplace = 'grailed') as grailed_n,
        max(n) filter (where marketplace = 'ebay') as ebay_n
    from by_piece_marketplace
    group by piece_id
),

both_sides as (
    select *
    from pivoted
    where grailed_median is not null
      and ebay_median is not null
      and grailed_median > 0
      and ebay_median > 0
      and grailed_n >= {{ var('min_spread_comps') }}
      and ebay_n >= {{ var('min_spread_comps') }}
)

select
    piece_id,
    model_name,
    round(grailed_median::numeric, 2) as grailed_median,
    round(ebay_median::numeric, 2) as ebay_median,
    grailed_n,
    ebay_n,
    round((grailed_median - ebay_median)::numeric, 2) as spread_usd,
    round(
        ((grailed_median - ebay_median) / nullif(ebay_median, 0))::numeric, 3
    ) as spread_pct
from both_sides
-- symmetric ratio guard: both directions treated the same
where greatest(grailed_median, ebay_median) / least(grailed_median, ebay_median)
      <= {{ var('spread_ratio_cap') }}
