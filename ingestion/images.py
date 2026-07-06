"""Assemble the piece_image reference set from resolved grail pieces.

Runs after a grail pull and resolution. It selects the model-level pieces on the
grail brands that carry a source image and inserts one row per listing image into
piece_image (idempotent on the listing natural key). The stable cached thumbnail
(cached_url) is filled later by the visual-search backfill; here we only capture
the source URL so the reference set is assembled and nothing is lost when a
marketplace CDN link expires.

    python -m ingestion.images
"""
from __future__ import annotations

from ingestion.db import connect
from ingestion.grail_seeds import GRAIL_TARGETS

# Grail brands (brand_norm) drawn straight from the target table's seed, so the
# reference set tracks whatever grail_targets covers.
GRAIL_BRANDS = sorted({t["brand_norm"] for t in GRAIL_TARGETS})

_INSERT = """
insert into piece_image
    (piece_id, marketplace_id, source_listing_id, image_url, is_primary)
select f.piece_id, f.marketplace_id, f.source_listing_id, f.image_url, true
from fact_sold_listing f
join dim_piece p on p.piece_id = f.piece_id
join dim_brand b on b.brand_id = p.brand_id
where f.image_url is not null
  and p.model_name is not null
  and b.brand_norm = any(%s)
on conflict (marketplace_id, source_listing_id) do nothing
"""


def populate_piece_image(conn) -> int:
    """Insert grail-piece listing images into piece_image; returns rows added."""
    with conn.cursor() as cur:
        cur.execute(_INSERT, (list(GRAIL_BRANDS),))
        added = cur.rowcount if cur.rowcount and cur.rowcount > 0 else 0
    conn.commit()
    return added


def main() -> int:
    with connect() as conn:
        added = populate_piece_image(conn)
        with conn.cursor() as cur:
            cur.execute("select count(*) from piece_image")
            total = cur.fetchone()[0]
            cur.execute(
                "select count(distinct piece_id) from piece_image where piece_id is not null"
            )
            pieces = cur.fetchone()[0]
    print(f"piece_image: inserted {added}, total {total}, across {pieces} pieces")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
