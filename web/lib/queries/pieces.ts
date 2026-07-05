import "server-only";
import { db } from "../db";
import { toPieceKey, fromPieceKey, type PieceKeyParts } from "../pieceKey";

// mart_piece_comps. numeric columns arrive as strings (kept as strings to avoid
// precision loss, cast at the render boundary in lib/format); bigint counts are
// cast to int so they arrive as numbers. canonical_key is derived, not stored.
export type PieceComp = {
  piece_id: number;
  brand_norm: string;
  archetype: string | null;
  model_name: string | null;
  season_code: string | null;
  n_sold: number;
  n_best_offer: number;
  median_usd: string;
  median_usd_reliable: string | null;
  p10_usd: string;
  p90_usd: string;
  confidence_grade: "A" | "B" | "C" | "D";
  recommended_list_price: string;
  recommended_basis: "piece" | "brand_archetype_fallback";
  canonical_key: string;
};

// The full projection, counts cast to int, numerics forced to text.
const COLS = `piece_id, brand_norm, archetype, model_name, season_code,
  n_sold::int as n_sold, n_best_offer::int as n_best_offer,
  median_usd::text as median_usd, median_usd_reliable::text as median_usd_reliable,
  p10_usd::text as p10_usd, p90_usd::text as p90_usd,
  confidence_grade, recommended_list_price::text as recommended_list_price, recommended_basis`;

function withKey(row: Omit<PieceComp, "canonical_key">): PieceComp {
  return { ...row, canonical_key: toPieceKey(row as PieceKeyParts) };
}

// A single piece, looked up by its derived key. `is not distinct from` matches
// the null archetype/model/season segments correctly.
export async function getPieceByKey(key: string): Promise<PieceComp | null> {
  const p = fromPieceKey(key);
  if (!p.brand_norm) return null;
  const rows = await db().unsafe(
    `select ${COLS} from mart_piece_comps
     where brand_norm = $1
       and archetype is not distinct from $2
       and model_name is not distinct from $3
       and season_code is not distinct from $4
     limit 1`,
    [p.brand_norm, p.archetype, p.model_name, p.season_code],
  );
  return rows.length ? withKey(rows[0] as unknown as Omit<PieceComp, "canonical_key">) : null;
}

// Every piece, richest first. The corpus is ~410 pieces, small enough to fetch
// once and filter client-side on the search page.
export async function getAllPieces(): Promise<PieceComp[]> {
  const rows = await db().unsafe(
    `select ${COLS} from mart_piece_comps order by n_sold desc, median_usd::numeric desc`,
  );
  return (rows as unknown as Omit<PieceComp, "canonical_key">[]).map(withKey);
}

// Keys to prebuild with generateStaticParams: the richest pieces, unioned with
// every piece that has a cross-marketplace spread (rare and worth prerendering).
// The long tail renders on demand.
export async function getStaticPieceKeys(limit = 40): Promise<string[]> {
  const rows = await db().unsafe(
    `select brand_norm, archetype, model_name, season_code from (
       select brand_norm, archetype, model_name, season_code, n_sold
       from mart_piece_comps order by n_sold desc limit $1
     ) top
     union
     select c.brand_norm, c.archetype, c.model_name, c.season_code
     from mart_cross_marketplace_spread s
     join mart_piece_comps c on c.piece_id = s.piece_id`,
    [limit],
  );
  return (rows as unknown as PieceKeyParts[]).map(toPieceKey);
}
