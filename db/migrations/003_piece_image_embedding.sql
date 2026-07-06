-- Visual search (Phase 4): image embeddings on the grail reference set.
-- Additive and idempotent, safe to re-run. pgvector 0.8.1 is available on Neon;
-- halfvec (0.7.0+) stores 16-bit floats, roughly half the size of vector at about
-- 98% recall, which is the right trade for a reference set this small. Vectors are
-- 768-dimension L2-normalized Marqo-FashionSigLIP image features, searched by
-- cosine distance (the <=> operator with halfvec_cosine_ops). 768 dims is far below
-- the halfvec HNSW cap, so it indexes directly. The embedding lives on piece_image
-- because retrieval is image-to-image: nearest images group up to their resolved
-- piece, which carries the comps.

create extension if not exists vector;

alter table piece_image add column if not exists embedding   halfvec(768);
alter table piece_image add column if not exists embedded_at  timestamptz;

-- HNSW index for approximate nearest-neighbor cosine search. Unembedded (null)
-- rows are skipped by the index and simply do not appear in results.
create index if not exists piece_image_embedding_hnsw
  on piece_image using hnsw (embedding halfvec_cosine_ops)
  with (m = 16, ef_construction = 64);
