select
    marketplace_id,
    name as marketplace
from {{ source('truecomp', 'dim_marketplace') }}
