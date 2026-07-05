import "server-only";
import { db } from "../db";

// mart_sold_velocity. eBay-only (eBay carries the only trusted sold date).
// Dates cast to text so React renders strings, not Date objects (the 500 that
// a typecheck sails past). sold_per_week kept as string.
export type Velocity = {
  n_sold_ebay: number;
  first_sold: string;
  last_sold: string;
  span_days: number;
  sold_per_week: string;
};

export async function getVelocity(pieceId: number): Promise<Velocity | null> {
  const rows = await db().unsafe(
    `select n_sold_ebay::int as n_sold_ebay, first_sold::text as first_sold,
            last_sold::text as last_sold, span_days, sold_per_week::text as sold_per_week
     from mart_sold_velocity where piece_id = $1`,
    [pieceId],
  );
  return rows.length ? (rows[0] as unknown as Velocity) : null;
}

// mart_cross_marketplace_spread. Rare by design (5 rows today). spread_pct is a
// RATIO (-0.457 = -45.7%), not a percent; the component multiplies by 100.
export type Spread = {
  model_name: string | null;
  grailed_median: string;
  ebay_median: string;
  grailed_n: number;
  ebay_n: number;
  spread_usd: string;
  spread_pct: string | null;
};

export async function getSpread(pieceId: number): Promise<Spread | null> {
  const rows = await db().unsafe(
    `select model_name, grailed_median::text as grailed_median, ebay_median::text as ebay_median,
            grailed_n::int as grailed_n, ebay_n::int as ebay_n,
            spread_usd::text as spread_usd, spread_pct::text as spread_pct
     from mart_cross_marketplace_spread where piece_id = $1`,
    [pieceId],
  );
  return rows.length ? (rows[0] as unknown as Spread) : null;
}

// mart_markdown_curves. Magnitude of the ask-to-sold gap, not a decay curve.
// The pct columns are ratios (0.1029 = 10.29%); the component multiplies by 100.
export type Markdown = {
  n_with_markdown: number;
  avg_markdown_pct: string;
  median_markdown_pct: string;
  p90_markdown_pct: string;
};

export async function getMarkdown(pieceId: number): Promise<Markdown | null> {
  const rows = await db().unsafe(
    `select n_with_markdown::int as n_with_markdown, avg_markdown_pct::text as avg_markdown_pct,
            median_markdown_pct::text as median_markdown_pct, p90_markdown_pct::text as p90_markdown_pct
     from mart_markdown_curves where piece_id = $1`,
    [pieceId],
  );
  return rows.length ? (rows[0] as unknown as Markdown) : null;
}

// Individual sold rows for the distribution and the comps table. Reads the
// cleaned intermediate (the one sanctioned read below a mart) so the histogram
// shares the mart's price fences. sold_date is null for every Grailed row.
export type Sale = {
  sold_id: number;
  marketplace: string;
  sold_price_usd: string;
  sold_date: string | null;
  price_reliability: string;
  raw_title: string;
  list_price: string | null;
};

export async function getSales(pieceId: number): Promise<Sale[]> {
  const rows = await db().unsafe(
    `select sold_id, marketplace, sold_price_usd::text as sold_price_usd,
            sold_date::text as sold_date, price_reliability, raw_title,
            list_price::text as list_price
     from int_sold_clean where piece_id = $1 order by sold_price_usd::numeric`,
    [pieceId],
  );
  return rows as unknown as Sale[];
}
