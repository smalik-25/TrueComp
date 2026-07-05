-- Regression guard: every surfaced cross-marketplace spread must be a real,
-- model-level comparison whose two medians sit within spread_ratio_cap of each
-- other. Returns rows (fails) if that invariant is ever broken.
select
    piece_id,
    grailed_median,
    ebay_median
from {{ ref('mart_cross_marketplace_spread') }}
where model_name is null
   or grailed_median is null
   or ebay_median is null
   or greatest(grailed_median, ebay_median) / least(grailed_median, ebay_median)
      > {{ var('spread_ratio_cap') }}
