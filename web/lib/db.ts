import "server-only";
import { Pool } from "pg";

// One pooled connection per server process. Neon autosuspends, so keep the pool
// small and let it reconnect on cold start.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

const pool =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 3,
  });

if (process.env.NODE_ENV !== "production") globalForPg._pgPool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

// mart_piece_comps: numeric columns arrive as strings from pg.
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
};

export type Velocity = {
  n_sold_ebay: number;
  first_sold: string;
  last_sold: string;
  span_days: number;
  sold_per_week: string;
};

export type Spread = {
  grailed_median: string;
  ebay_median: string;
  grailed_n: number;
  ebay_n: number;
  spread_usd: string;
  spread_pct: string | null;
};

export type Markdown = {
  n_with_markdown: number;
  avg_markdown_pct: string;
  median_markdown_pct: string;
  p90_markdown_pct: string;
};

export type Sale = {
  sold_price_usd: string;
  marketplace: string;
  sold_date: string | null;
};

export function searchPieces(q: string): Promise<PieceComp[]> {
  const like = `%${q}%`;
  return query<PieceComp>(
    `select * from mart_piece_comps
     where brand_norm ilike $1
        or coalesce(model_name, '') ilike $1
        or coalesce(archetype, '') ilike $1
     order by n_sold desc, median_usd desc
     limit 50`,
    [like],
  );
}

export function topPieces(): Promise<PieceComp[]> {
  return query<PieceComp>(
    `select * from mart_piece_comps order by n_sold desc, median_usd desc limit 24`,
  );
}

export async function getPiece(id: number): Promise<PieceComp | null> {
  const rows = await query<PieceComp>(
    `select * from mart_piece_comps where piece_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getVelocity(id: number): Promise<Velocity | null> {
  // date columns cast to text so React renders them as strings, not Date objects
  const rows = await query<Velocity>(
    `select n_sold_ebay, first_sold::text, last_sold::text, span_days, sold_per_week
     from mart_sold_velocity where piece_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getSpread(id: number): Promise<Spread | null> {
  const rows = await query<Spread>(
    `select grailed_median, ebay_median, grailed_n, ebay_n, spread_usd, spread_pct
     from mart_cross_marketplace_spread where piece_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getMarkdown(id: number): Promise<Markdown | null> {
  const rows = await query<Markdown>(
    `select n_with_markdown, avg_markdown_pct, median_markdown_pct, p90_markdown_pct
     from mart_markdown_curves where piece_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// Individual sold prices for the distribution histogram. Reads the cleaned
// intermediate view so the histogram matches the mart medians (same fences).
export function getSales(id: number): Promise<Sale[]> {
  return query<Sale>(
    `select sold_price_usd, marketplace, sold_date::text
     from int_sold_clean where piece_id = $1 order by sold_price_usd`,
    [id],
  );
}
