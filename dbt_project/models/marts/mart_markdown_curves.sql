-- Markdown behaviour per piece, from list_price / markdown_pct. In practice this
-- is Grailed-driven, since eBay sold rows carry no ask. (Grailed's priceDrops
-- array is not stored on the fact yet; if the full drop curve is needed later it
-- becomes a small child table, flagged as a migration.)
with with_markdown as (
    select *
    from {{ ref('int_sold_enriched') }}
    where piece_id is not null
      and markdown_pct is not null
)

select
    piece_id,
    max(brand_norm) as brand_norm,
    max(archetype) as archetype,
    count(*) as n_with_markdown,
    round(avg(markdown_pct)::numeric, 4) as avg_markdown_pct,
    round(
        percentile_cont(0.5) within group (order by markdown_pct)::numeric, 4
    ) as median_markdown_pct,
    round(
        percentile_cont(0.9) within group (order by markdown_pct)::numeric, 4
    ) as p90_markdown_pct
from with_markdown
group by piece_id
