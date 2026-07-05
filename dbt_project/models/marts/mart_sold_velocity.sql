-- Velocity is eBay-only because eBay's endedAt is the only trusted sold date
-- (DQ rule 1); Grailed rows are undated and never enter a time-series.
-- Note: days-to-sell needs a listing-start date, which eBay sold comps do not
-- carry, so it is not derivable here. sold_per_week is the sell-through proxy.
with ebay as (
    select *
    from {{ ref('int_sold_enriched') }}
    where marketplace = 'ebay'
      and piece_id is not null
      and sold_date is not null
)

select
    piece_id,
    max(brand_norm) as brand_norm,
    max(archetype) as archetype,
    max(model_name) as model_name,
    count(*) as n_sold_ebay,
    min(sold_date) as first_sold,
    max(sold_date) as last_sold,
    (max(sold_date) - min(sold_date)) as span_days,
    round(
        count(*)::numeric
        / greatest((max(sold_date) - min(sold_date))::numeric / 7.0, 1),
        2
    ) as sold_per_week
from ebay
group by piece_id
