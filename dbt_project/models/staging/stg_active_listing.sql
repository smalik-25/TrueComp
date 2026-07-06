-- One row per active-listing snapshot, typed passthrough of the fact table.
-- piece_id is null for rows entity resolution has not stamped yet.
select
    active_id,
    piece_id,
    marketplace_id,
    condition_id,
    size_id,
    source_listing_id,
    raw_title,
    ask_price,
    currency,
    ask_price_usd,
    snapshot_date,
    query_keyword
from {{ source('truecomp', 'fact_active_listing') }}
