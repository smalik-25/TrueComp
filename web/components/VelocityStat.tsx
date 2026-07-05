import type { Velocity } from "@/lib/queries/detail";
import { formatInt } from "@/lib/format";
import { SourceTag } from "./SourceTag";

// Velocity is honest about its ceiling: eBay sold comps carry no listing-start
// date, so there is no days-to-sell, only a sold-per-week rate over the window
// actually observed. eBay-only, and labeled as such. Absent, with a plain note,
// when the piece has no dated eBay sales.
export function VelocityStat({ velocity }: { velocity: Velocity | null }) {
  if (!velocity) {
    return (
      <p className="section-note">
        No dated eBay sales for this piece, so there is no velocity to report. eBay carries the only
        trusted sold date; Grailed comps are undated.
      </p>
    );
  }
  const perWeek = Number(velocity.sold_per_week);
  return (
    <div className="stat-row">
      <div className="statblock">
        <span className="statblock-value">{perWeek.toFixed(1)}</span>
        <span className="statblock-label">Sold per week</span>
      </div>
      <div className="statblock">
        <span className="statblock-value">{formatInt(velocity.n_sold_ebay)}</span>
        <span className="statblock-label">eBay sales</span>
      </div>
      <div className="stat-window">
        <span className="statblock-label">Observed window</span>
        <span className="mono">
          {velocity.first_sold} to {velocity.last_sold}
        </span>
        <span className="mono ink-3">{velocity.span_days} days</span>
      </div>
      <div className="stat-source">
        <SourceTag source="ebay" />
        <span className="t-caption ink-3">Rate over the observed window. No days-to-sell.</span>
      </div>
    </div>
  );
}
