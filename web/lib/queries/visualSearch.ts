import "server-only";
import { db } from "../db";
import { toPieceKey, type PieceKeyParts } from "../pieceKey";

// Image-to-image retrieval over the reference set. A query embedding is compared
// by cosine distance to every reference image's halfvec (HNSW index), the nearest
// images roll up to their resolved piece, and each piece arrives with its comps.
// Numeric mart columns come back as strings (cast at render); distance/counts are
// cast to numbers here. canonical_key is derived, not stored.
export type VisualMatch = {
  piece_id: number;
  brand_norm: string;
  archetype: string | null;
  model_name: string | null;
  season_code: string | null;
  confidence_grade: "A" | "B" | "C" | "D";
  n_sold: number;
  median_usd: string | null;
  p10_usd: string | null;
  p90_usd: string | null;
  recommended_list_price: string | null;
  best_distance: number; // cosine distance of this piece's nearest image
  similarity: number; // 1 - best_distance
  n_images: number; // how many of the nearest images are this piece
  replica_hazard: boolean;
  canonical_key: string;
};

// Confidence tiers, calibrated from the in-set nearest-neighbour distance
// distribution (correct matches cluster <=0.14, wrong-brand mostly >=0.20, p99
// of correct ~0.31). Distances, not similarities, so lower is closer.
const T_STRONG = 0.12;
const T_LIKELY = 0.2;
const T_WEAK = 0.32;

// Pull this many nearest images, then group to pieces. Wide enough to gather
// several images per piece and a few candidate pieces.
const NEAREST_IMAGES = 80;
const MAX_PIECES = 6;

// Build a pgvector literal from our own embedding. Inlined as a quoted string
// (unknown-typed, parsed by pgvector's input function) rather than bound as $1,
// because a bound text param would need a text->halfvec cast that does not exist,
// and a subquery operand would stop the HNSW index being used. The values are
// numbers straight from the embed worker, so there is nothing to escape; the
// finite guard is the only validation needed.
function vecLiteral(v: number[]): string {
  for (const x of v) {
    if (!Number.isFinite(x)) throw new Error("query vector has a non-finite value");
  }
  return "[" + v.join(",") + "]";
}

export async function searchByVector(vec: number[]): Promise<VisualMatch[]> {
  const lit = vecLiteral(vec);
  const rows = await db().unsafe(
    `with nn as (
       select pi.piece_id, (pi.embedding <=> '${lit}'::halfvec) as distance
       from piece_image pi
       where pi.embedding is not null
       order by pi.embedding <=> '${lit}'::halfvec
       limit ${NEAREST_IMAGES}
     ),
     agg as (
       select piece_id, min(distance) as best_distance, count(*) as n_images
       from nn group by piece_id
     )
     select c.piece_id, c.brand_norm, c.archetype, c.model_name, c.season_code,
            c.confidence_grade,
            c.n_sold::int as n_sold,
            c.median_usd::text as median_usd,
            c.p10_usd::text as p10_usd,
            c.p90_usd::text as p90_usd,
            c.recommended_list_price::text as recommended_list_price,
            a.best_distance::float8 as best_distance,
            a.n_images::int as n_images,
            coalesce(bool_or(gt.replica_hazard), false) as replica_hazard
     from agg a
     join mart_piece_comps c on c.piece_id = a.piece_id
     left join grail_targets gt
       on gt.brand_norm = c.brand_norm and gt.replica_hazard
      and c.model_name is not null
      and c.model_name ilike '%' || gt.canonical_name || '%'
     group by c.piece_id, c.brand_norm, c.archetype, c.model_name, c.season_code,
              c.confidence_grade, c.n_sold, c.median_usd, c.p10_usd, c.p90_usd,
              c.recommended_list_price, a.best_distance, a.n_images
     order by a.best_distance asc
     limit ${MAX_PIECES}`,
  );
  return (rows as unknown as Omit<VisualMatch, "similarity" | "canonical_key">[]).map((r) => ({
    ...r,
    // Cosine distance runs 0..2, so a far (out-of-set) match can exceed 1; clamp
    // so the UI never renders a negative "similarity".
    similarity: Math.max(0, 1 - Number(r.best_distance)),
    canonical_key: toPieceKey(r as PieceKeyParts),
  }));
}

export type Verdict = {
  tier: "strong" | "likely" | "weak" | "none";
  brand: string | null; // asserted brand_norm, null when not confident
  archetype: string | null;
  model: string | null; // "likely" model, null when too uncertain
  brandConsensus: number; // share of top pieces agreeing on the top brand
};

// Turn the ranked matches into an honest verdict. Brand and archetype are the
// confident claims; the exact model is a hedge; out-of-set uploads land in
// "none" rather than a forced guess.
export function gradeMatch(matches: VisualMatch[]): Verdict {
  if (!matches.length) {
    return { tier: "none", brand: null, archetype: null, model: null, brandConsensus: 0 };
  }
  const top = matches[0];
  const d = top.best_distance;
  const topK = matches.slice(0, 5);
  const consensus = topK.filter((m) => m.brand_norm === top.brand_norm).length / topK.length;

  if (d <= T_STRONG || d <= T_LIKELY) {
    return {
      tier: d <= T_STRONG ? "strong" : "likely",
      brand: top.brand_norm,
      archetype: top.archetype,
      model: top.model_name,
      brandConsensus: consensus,
    };
  }
  if (d <= T_WEAK) {
    const brand = consensus >= 0.6 ? top.brand_norm : null;
    return {
      tier: "weak",
      brand,
      archetype: brand ? top.archetype : null,
      model: null,
      brandConsensus: consensus,
    };
  }
  return { tier: "none", brand: null, archetype: null, model: null, brandConsensus: consensus };
}
