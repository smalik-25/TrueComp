-- Underpriced active asks: a live listing priced below a piece's P10 sold price,
-- only for model-level pieces with at least three comps. Two guards, both about
-- honesty: >=3 comps so a one-sale median never triggers a signal, and model-level
-- only so the ask is compared to one object, never a coarse brand+archetype pool of
-- mixed items where a cheap piece looks underpriced against a blended median. It
-- reads mart_piece_comps for the price level, not the model, because on this corpus
-- the model does not beat that median. The framing rides along in the columns: the
-- ask, the sold floor it sits under, the discount to the median, and the comp count
-- and grade the whole thing rests on. An ask under the sold-comp floor, not a
-- guaranteed profit. Empty until an active-listing pull loads fact_active_listing.
with latest_active as (
    select distinct on (marketplace_id, source_listing_id)
        active_id,
        piece_id,
        marketplace_id,
        source_listing_id,
        raw_title,
        ask_price_usd,
        snapshot_date
    from {{ ref('stg_active_listing') }}
    where piece_id is not null
    order by marketplace_id, source_listing_id, snapshot_date desc
)

select
    a.active_id,
    a.piece_id,
    m.marketplace,
    a.source_listing_id,
    a.raw_title,
    round(a.ask_price_usd::numeric, 2) as ask_price_usd,
    a.snapshot_date,
    c.brand_norm,
    c.archetype,
    c.model_name,
    c.season_code,
    c.median_usd,
    c.p10_usd,
    c.n_sold,
    c.confidence_grade,
    round(
        ((c.median_usd - a.ask_price_usd) / nullif(c.median_usd, 0))::numeric, 3
    ) as discount_vs_median
from latest_active a
join {{ ref('mart_piece_comps') }} c on c.piece_id = a.piece_id
join {{ ref('stg_marketplace') }} m on m.marketplace_id = a.marketplace_id
where a.ask_price_usd < c.p10_usd
  and c.n_sold >= 3
  and c.model_name is not null
order by discount_vs_median desc
