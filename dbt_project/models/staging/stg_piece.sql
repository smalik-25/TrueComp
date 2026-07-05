-- Resolved pieces with their brand attached.
select
    p.piece_id,
    p.archetype,
    p.model_name,
    p.season_code,
    p.canonical_key,
    b.brand_norm,
    b.brand_raw
from {{ source('truecomp', 'dim_piece') }} p
left join {{ source('truecomp', 'dim_brand') }} b on b.brand_id = p.brand_id
