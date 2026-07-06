-- Cleaned sold rows for the marts: resolved pieces only, deduped, with near-zero
-- junk (stickers, key rings, listing errors) fenced out by a low absolute floor.
--
-- Deliberately minimal on filtering. An earlier version also filtered replica/fake
-- title tokens; that was removed after review showed it deleted authentic pieces
-- whose model name legitimately contains those words (Maison Margiela's "Replica"
-- line, Raf Simons "Replicant"), caught zero real counterfeits, and biased the very
-- spreads it was meant to protect. The floor is kept low on purpose: a higher floor
-- is a one-sided cut that biases medians upward and discards genuine low-priced
-- designer sales. Real contamination (fakes, grab-bag pieces) is a resolution
-- problem, handled upstream, not with a blunt price/title fence.
--
-- Dedup: the fact table's natural key (marketplace_id, source_listing_id) blocks an
-- exact same-source reload, but the same physical listing can still reach the marts
-- twice under two source_listing_ids (an actor re-pull under a second keyword, or an
-- id-scheme change), double-counting a piece's comps. Keep one row per
-- (marketplace, piece, size, whole-dollar price, normalized title): a fingerprint
-- tight enough that two genuinely distinct sales almost never collide, so it drops
-- re-surfaced duplicates without collapsing real sales. It stays within a
-- marketplace on purpose, so a piece that truly sold on both Grailed and eBay keeps
-- both sides for the cross-marketplace spread.
with deduped as (
    select
        e.*,
        row_number() over (
            partition by
                e.marketplace,
                e.piece_id,
                coalesce(e.size_id, -1),
                round(e.sold_price_usd::numeric, 0),
                regexp_replace(lower(coalesce(e.raw_title, '')), '[^a-z0-9]+', ' ', 'g')
            order by
                (e.sold_date is not null) desc,
                (e.price_reliability = 'reliable') desc,
                e.sold_id
        ) as _rn
    from {{ ref('int_sold_enriched') }} e
    where e.piece_id is not null
      and e.sold_price_usd >= {{ var('price_floor_usd') }}
)
select
    sold_id,
    piece_id,
    size_id,
    raw_title,
    brand_norm,
    archetype,
    model_name,
    season_code,
    marketplace,
    sold_price_usd,
    list_price,
    markdown_pct,
    sold_date,
    listed_no_earlier_than,
    price_reliability,
    strata
from deduped
where _rn = 1
