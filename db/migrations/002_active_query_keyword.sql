-- Active-listing resolution parity (Phase 3). The active fact needs the same
-- query_keyword the sold fact carries so entity resolution has the seed prior
-- when it stamps piece_id onto active rows. Additive and idempotent.

alter table fact_active_listing add column if not exists query_keyword text;
