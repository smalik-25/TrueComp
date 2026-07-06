-- Grail extension (Phase 1): reference targets, per-piece images, and a source
-- image URL captured at ingest. Additive and idempotent, safe to re-run against
-- the existing database (apply_schema.py rebuilds the base schema from scratch
-- and cannot re-run against a populated db, so extension changes land here).

alter table fact_sold_listing add column if not exists image_url text;

create table if not exists grail_targets (
  target_id              serial primary key,
  brand_norm             text not null,
  canonical_name         text not null,
  archetype              text,
  alt_names              text[] default '{}',
  visual_distinctiveness text,
  replica_hazard         boolean default false,
  notes                  text,
  unique (brand_norm, canonical_name)
);

create table if not exists piece_image (
  image_id          serial primary key,
  piece_id          int references dim_piece(piece_id),
  marketplace_id    int references dim_marketplace(marketplace_id),
  source_listing_id text not null,
  image_url         text not null,
  cached_url        text,
  is_primary        boolean default true,
  ingested_at       timestamptz default now(),
  unique (marketplace_id, source_listing_id)
);
