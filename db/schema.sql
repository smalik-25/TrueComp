-- TrueComp canonical schema (Postgres). Matches PROJECT_PLAN Section 6.
-- Design once so later phases never force a migration.
-- Idempotent loads rely on the natural-key UNIQUE constraints below
-- (loaders use ON CONFLICT DO NOTHING on those keys).

-- Dimensions first (facts reference them).

CREATE TABLE dim_brand (
  brand_id   SERIAL PRIMARY KEY,
  brand_raw  text,
  brand_norm text,
  UNIQUE (brand_norm)
);

CREATE TABLE dim_piece (                 -- entity-resolution target
  piece_id         SERIAL PRIMARY KEY,
  brand_id         int REFERENCES dim_brand(brand_id),
  archetype        text,                 -- jacket, denim, tee, knit, boot...
  model_name       text,                 -- Ramones, Detroit Cut...
  season_code      text,                 -- SS09, AW04, null if unknown
  collection_alias text,
  canonical_key    text NOT NULL,
  UNIQUE (canonical_key)
);

CREATE TABLE dim_marketplace (
  marketplace_id SERIAL PRIMARY KEY,
  name           text UNIQUE            -- grailed, ebay, yahoo_jp
);

CREATE TABLE dim_condition (
  condition_id SERIAL PRIMARY KEY,
  source       text,                    -- per-source vocab; never joined across sources on raw text
  raw          text,
  grade_norm   text
);

CREATE TABLE dim_size (
  size_id   SERIAL PRIMARY KEY,
  raw       text,
  size_norm text
);

CREATE TABLE fact_sold_listing (         -- grain = one completed sale
  sold_id                 SERIAL PRIMARY KEY,
  piece_id                int REFERENCES dim_piece(piece_id),
  marketplace_id          int REFERENCES dim_marketplace(marketplace_id),
  condition_id            int REFERENCES dim_condition(condition_id),
  size_id                 int REFERENCES dim_size(size_id),
  source_listing_id       text NOT NULL,
  raw_title               text,
  sold_price              numeric NOT NULL,
  currency                text NOT NULL,
  sold_price_usd          numeric NOT NULL,
  list_price              numeric,       -- Grailed last ask; null for eBay
  markdown_pct            numeric,       -- (list-sold)/list when both present
  sold_date               date,          -- eBay endedAt; NULL for Grailed (DQ rule 1)
  listed_no_earlier_than  date,          -- Grailed createdAt lower bound; null for eBay
  listing_type            text,          -- auction / buy_it_now / best_offer_accepted
  price_reliability       text,          -- 'reliable' | 'best_offer'
  strata                  text,          -- Grailed hype/luxury/grailed
  query_keyword           text,          -- seed query, for audit
  ingested_at             timestamptz DEFAULT now(),
  UNIQUE (marketplace_id, source_listing_id)
);

CREATE TABLE fact_active_listing (        -- grain = one active-listing snapshot; populated Phase 5
  active_id         SERIAL PRIMARY KEY,
  piece_id          int,                  -- Section 6 declares these without FKs; adding FKs later is a flagged migration
  marketplace_id    int,
  condition_id      int,
  size_id           int,
  source_listing_id text NOT NULL,
  raw_title         text,
  ask_price         numeric NOT NULL,
  currency          text NOT NULL,
  ask_price_usd     numeric NOT NULL,
  snapshot_date     date NOT NULL,
  ingested_at       timestamptz DEFAULT now(),
  UNIQUE (marketplace_id, source_listing_id, snapshot_date)
);

CREATE TABLE fx_rate (
  currency     text PRIMARY KEY,
  usd_per_unit numeric NOT NULL,
  updated_at   date
);
