-- Cleaned sold rows for the marts: resolved pieces only, with near-zero junk
-- (stickers, key rings, listing errors) fenced out by a low absolute floor.
--
-- Deliberately minimal. An earlier version also filtered replica/fake title
-- tokens; that was removed after review showed it deleted authentic pieces whose
-- model name legitimately contains those words (Maison Margiela's "Replica" line,
-- Raf Simons "Replicant"), caught zero real counterfeits, and biased the very
-- spreads it was meant to protect. The floor is kept low on purpose: a higher
-- floor is a one-sided cut that biases medians upward and discards genuine
-- low-priced designer sales. Real contamination (fakes, grab-bag pieces) is a
-- resolution problem and is handled upstream, not with a blunt price/title fence.
select *
from {{ ref('int_sold_enriched') }}
where piece_id is not null
  and sold_price_usd >= {{ var('price_floor_usd') }}
