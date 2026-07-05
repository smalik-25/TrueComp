-- One row per completed sale, typed passthrough of the fact table.
select
    sold_id,
    piece_id,
    marketplace_id,
    condition_id,
    size_id,
    source_listing_id,
    raw_title,
    sold_price_usd,
    list_price,
    markdown_pct,
    sold_date,
    listed_no_earlier_than,
    listing_type,
    price_reliability,
    strata,
    query_keyword
from {{ source('truecomp', 'fact_sold_listing') }}
