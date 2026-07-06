-- One row per condition dimension value: the per-source raw grade mapped to the
-- cross-source grade_norm (DQ rule 4). grade_norm is the only field safe to match
-- across marketplaces; source and raw stay for audit.
select
    condition_id,
    source,
    raw,
    grade_norm
from {{ source('truecomp', 'dim_condition') }}
