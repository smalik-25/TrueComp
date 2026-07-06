import { formatUsd, formatRatioPct } from "@/lib/format";
import type { Arbitrage } from "@/lib/queries/arbitrage";

// A per-piece flag: an active ask sitting under this piece's sold-comp floor.
// Framed honestly, an ask under the floor is not a guaranteed profit; it can be a
// fake, the wrong size, or a stale listing. The comp count and grade travel with
// it so the reader knows how firm the floor is.
export function ArbitrageFlag({ signals }: { signals: Arbitrage[] }) {
  if (signals.length === 0) return null;
  const best = signals[0];
  return (
    <aside className="arb-flag">
      <span className="arb-flag-label">Underpriced now</span>
      <p className="arb-flag-body">
        {signals.length === 1 ? "An active ask is" : `${signals.length} active asks are`} sitting
        under this piece&rsquo;s sold-comp floor. The lowest is{" "}
        <span className="mono">{formatUsd(best.ask_price_usd)}</span>,{" "}
        <span className="mono">{formatRatioPct(best.discount_vs_median)}</span> under the sold
        median of <span className="mono">{formatUsd(best.median_usd)}</span> across {best.n_sold}{" "}
        comps. An ask under the floor, not a promised profit: it could be a fake, a wrong size, or
        a stale listing.
      </p>
    </aside>
  );
}
