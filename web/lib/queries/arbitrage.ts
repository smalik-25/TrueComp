import "server-only";
import { db } from "../db";
import { toPieceKey, type PieceKeyParts } from "../pieceKey";

// mart_arbitrage: active asks below a piece's P10 sold price. Numeric columns
// arrive as strings (cast at the render boundary); counts are cast to int.
// discount_vs_median is a ratio (0.15 == 15% under the sold median).
export type Arbitrage = {
  active_id: number;
  piece_id: number;
  marketplace: string;
  source_listing_id: string;
  raw_title: string | null;
  ask_price_usd: string;
  n_listings: number;
  snapshot_date: string;
  brand_norm: string;
  archetype: string | null;
  model_name: string | null;
  season_code: string | null;
  median_usd: string;
  p10_usd: string;
  n_sold: number;
  confidence_grade: "A" | "B" | "C" | "D";
  discount_vs_median: string;
  canonical_key: string;
};

const COLS = `active_id, piece_id, marketplace, source_listing_id, raw_title,
  ask_price_usd::text as ask_price_usd, n_listings::int as n_listings,
  snapshot_date::text as snapshot_date,
  brand_norm, archetype, model_name, season_code,
  median_usd::text as median_usd, p10_usd::text as p10_usd, n_sold::int as n_sold,
  confidence_grade, discount_vs_median::text as discount_vs_median`;

function withKey(row: Omit<Arbitrage, "canonical_key">): Arbitrage {
  return { ...row, canonical_key: toPieceKey(row as PieceKeyParts) };
}

// The underpriced view: every active ask below its piece's sold floor, richest
// discount first. Empty until an active-listing pull loads fact_active_listing.
export async function getUnderpriced(limit = 50): Promise<Arbitrage[]> {
  const rows = await db().unsafe(
    `select ${COLS} from mart_arbitrage order by discount_vs_median::numeric desc limit $1`,
    [limit],
  );
  return (rows as unknown as Omit<Arbitrage, "canonical_key">[]).map(withKey);
}

// The per-piece flag: any active asks under this one piece's floor.
export async function getArbitrageForPiece(pieceId: number): Promise<Arbitrage[]> {
  const rows = await db().unsafe(
    `select ${COLS} from mart_arbitrage where piece_id = $1 order by discount_vs_median::numeric desc`,
    [pieceId],
  );
  return (rows as unknown as Omit<Arbitrage, "canonical_key">[]).map(withKey);
}
