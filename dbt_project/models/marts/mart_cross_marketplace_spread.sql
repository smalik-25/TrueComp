-- Per piece, the median sold price on each marketplace and the spread between
-- them. Only pieces that sold on both sources appear. With the seed fixtures the
-- two sources barely overlap, so this is sparse by construction; it fills in as
-- the corpus grows and more pieces resolve across marketplaces.
with by_piece_marketplace as (
    select
        piece_id,
        marketplace,
        count(*) as n,
        percentile_cont(0.5) within group (order by sold_price_usd) as median_usd
    from {{ ref('int_sold_enriched') }}
    where piece_id is not null
    group by piece_id, marketplace
),

pivoted as (
    select
        piece_id,
        max(median_usd) filter (where marketplace = 'grailed') as grailed_median,
        max(median_usd) filter (where marketplace = 'ebay') as ebay_median,
        max(n) filter (where marketplace = 'grailed') as grailed_n,
        max(n) filter (where marketplace = 'ebay') as ebay_n
    from by_piece_marketplace
    group by piece_id
)

select
    piece_id,
    round(grailed_median::numeric, 2) as grailed_median,
    round(ebay_median::numeric, 2) as ebay_median,
    grailed_n,
    ebay_n,
    round((grailed_median - ebay_median)::numeric, 2) as spread_usd,
    case
        when ebay_median > 0
        then round(((grailed_median - ebay_median) / ebay_median)::numeric, 3)
    end as spread_pct
from pivoted
where grailed_median is not null
  and ebay_median is not null
