import type { Spread } from "@/lib/queries/detail";
import { formatUsd, formatRatioPct, formatCount } from "@/lib/format";
import { SourceTag } from "./SourceTag";

// Cross-marketplace spread, rare by design: only model-level pieces with enough
// comps on both sides inside the trust cap qualify (5 pieces today). Graceful
// absence is the default state, not the exception. spread_pct is Grailed
// relative to eBay: positive means Grailed runs above eBay.
export function SpreadPanel({ spread }: { spread: Spread | null }) {
  if (!spread) {
    return (
      <p className="section-note">
        Sold on one marketplace so far, so there is no cross-marketplace spread to compare. This is
        the normal state for archive pieces, not an error.
      </p>
    );
  }
  const ratio = spread.spread_pct === null ? null : Number(spread.spread_pct);
  const grailedHigher = ratio !== null && ratio > 0;
  return (
    <div className="spread">
      <div className="spread-sides">
        <div className="spread-side">
          <SourceTag source="grailed" />
          <span className="spread-median">{formatUsd(spread.grailed_median)}</span>
          <span className="mono ink-3">{formatCount(spread.grailed_n, "comp")}</span>
        </div>
        <div className="spread-side">
          <SourceTag source="ebay" />
          <span className="spread-median">{formatUsd(spread.ebay_median)}</span>
          <span className="mono ink-3">{formatCount(spread.ebay_n, "comp")}</span>
        </div>
      </div>
      <p className="spread-read">
        <span className="spread-pct spark">{formatRatioPct(spread.spread_pct, { sign: true })}</span>
        <span className="t-small ink-2">
          Grailed runs {grailedHigher ? "above" : "below"} eBay for this piece
          {" "}(<span className="num">{formatUsd(Math.abs(Number(spread.spread_usd)))}</span> on the
          median).
        </span>
      </p>
    </div>
  );
}
