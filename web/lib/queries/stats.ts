import "server-only";
import { db } from "../db";

// Summary counts for the landing stat strip. Everything traces to a mart or the
// cleaned intermediate. "Last refresh" is intentionally absent: no run timestamp
// is persisted anywhere the site can read, so it is not invented here.
export type SiteStats = {
  pieces: number;
  sold_rows: number;
  marketplaces: number;
  cross_market_pieces: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  const rows = await db().unsafe(
    `select
       (select count(*)::int from mart_piece_comps) as pieces,
       (select count(*)::int from int_sold_clean) as sold_rows,
       (select count(distinct marketplace)::int from int_sold_clean) as marketplaces,
       (select count(*)::int from mart_cross_marketplace_spread) as cross_market_pieces`,
  );
  return rows[0] as unknown as SiteStats;
}
