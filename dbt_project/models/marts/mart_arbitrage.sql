-- Underpriced active asks, judged like-for-like on CONDITION. A live ask is a
-- signal only when it sits at least min_discount_vs_median below the sold median
-- of comps in the SAME grade_norm (a "good" ask against "good" comps, never a
-- pool blending new and fair), for a model-level piece with at least three
-- same-grade comps and a same-grade dispersion (p90/p10) within 2x. Matching on
-- condition is what stops a wide blended pool from posting a phantom discount: a
-- used Triple S looks underpriced against a piece-level median lifted by deadstock
-- pairs, but within its own "good" grade it is priced normally.
--
-- The floor is the same-condition median, not P10: P10 (cheaper than ~90% of all
-- sales) is too extreme a bar for a thin-margin market where a modest discount off
-- the like-for-like median is already a real signal. P10 is still carried for
-- display context. Not a profit promise; still could be a fake, wrong size or stale.
--
-- Two-stage dedup, unchanged: the freshest snapshot per listing, then one row per
-- opportunity (piece, condition, size, rounded ask), so repeated asks collapse to
-- a single row that reports n_listings. Reads mart_piece_condition_comps for the
-- floor. Empty until an active-listing pull loads fact_active_listing.
with latest_snapshot as (
    select distinct on (a.marketplace_id, a.source_listing_id)
        a.active_id,
        a.piece_id,
        a.marketplace_id,
        a.condition_id,
        cond.grade_norm,
        a.size_id,
        a.source_listing_id,
        a.raw_title,
        a.ask_price_usd,
        a.snapshot_date
    from {{ ref('stg_active_listing') }} a
    join {{ ref('stg_condition') }} cond on cond.condition_id = a.condition_id
    where a.piece_id is not null
      and cond.grade_norm is not null
    order by a.marketplace_id, a.source_listing_id, a.snapshot_date desc
),

latest_active as (
    select distinct on (
        marketplace_id, piece_id, condition_id, size_id, round(ask_price_usd::numeric, 2)
    )
        active_id,
        piece_id,
        marketplace_id,
        grade_norm,
        source_listing_id,
        raw_title,
        ask_price_usd,
        snapshot_date,
        count(*) over (
            partition by marketplace_id, piece_id, condition_id, size_id,
                         round(ask_price_usd::numeric, 2)
        ) as n_listings
    from latest_snapshot
    order by
        marketplace_id, piece_id, condition_id, size_id, round(ask_price_usd::numeric, 2),
        snapshot_date desc, source_listing_id desc
)

select
    a.active_id,
    a.piece_id,
    m.marketplace,
    a.source_listing_id,
    a.raw_title,
    round(a.ask_price_usd::numeric, 2) as ask_price_usd,
    a.n_listings::int as n_listings,
    a.snapshot_date,
    cc.grade_norm,
    cc.brand_norm,
    cc.archetype,
    cc.model_name,
    cc.season_code,
    cc.median_usd,
    cc.p10_usd,
    cc.p90_usd,
    cc.n_sold,
    cc.confidence_grade,
    round(
        ((cc.median_usd - a.ask_price_usd) / nullif(cc.median_usd, 0))::numeric, 3
    ) as discount_vs_median
from latest_active a
join {{ ref('mart_piece_condition_comps') }} cc
    on cc.piece_id = a.piece_id and cc.grade_norm = a.grade_norm
join {{ ref('stg_marketplace') }} m on m.marketplace_id = a.marketplace_id
where (cc.median_usd - a.ask_price_usd) / nullif(cc.median_usd, 0)
        >= {{ var('min_discount_vs_median') }}
  and cc.n_sold >= 3
  and cc.model_name is not null
  and cc.dispersion <= 2.0
order by discount_vs_median desc
