import { formatCount } from "@/lib/format";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CountUp } from "./CountUp";

// The answer. Recommended list price large in mono, its confidence grade, and
// the sample size it rests on. When the piece is too thin, the recommendation
// falls back to the brand-and-archetype median, and that is stated in the open,
// not hidden (honesty rule, section 7).
export function RecommendationBlock({
  recommendedListPrice,
  grade,
  nSold,
  basis,
}: {
  recommendedListPrice: string;
  grade: "A" | "B" | "C" | "D";
  nSold: number;
  basis: "piece" | "brand_archetype_fallback";
}) {
  const fallback = basis === "brand_archetype_fallback";
  return (
    <section className="rec" aria-label="Recommended list price">
      <p className="rec-label">Recommended list price</p>
      <p className="rec-value">
        <CountUp value={Number(recommendedListPrice)} kind="usd" className="spark" />
      </p>
      <div className="rec-support">
        <ConfidenceBadge grade={grade} caption={formatCount(nSold, "comp")} />
        <span className="rec-basis">
          {fallback
            ? "Rests on the brand-and-archetype median. Too few comps for a piece-level read."
            : "Priced off this piece's own sold comps."}
        </span>
      </div>
    </section>
  );
}
