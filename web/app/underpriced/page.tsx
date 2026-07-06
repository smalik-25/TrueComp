import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { ViewTransitionLink } from "@/components/ViewTransitionLink";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { getUnderpriced } from "@/lib/queries/arbitrage";
import { displayBrand, formatUsd, formatRatioPct, formatInt } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Underpriced now" };

export default async function UnderpricedPage() {
  const signals = await getUnderpriced(50);
  return (
    <Container>
      <div className="stack-4" style={{ paddingBlock: "var(--space-7)" }}>
        <header className="stack-3">
          <KickerLabel>Active asks under same-condition comps</KickerLabel>
          <h1 className="serif" style={{ fontSize: "var(--t-display)", lineHeight: 1.05 }}>
            Underpriced now
          </h1>
          <p className="prose measure ink-2">
            Live listings priced at least 15% below the median of{" "}
            <em>same-condition</em> sold comps, ranked by how far under they sit. Each ask is
            matched like-for-like on grade, and only against pieces with at least three same-grade
            comps and a comp spread tight enough to trust. This is an ask under the like-for-like
            comp floor, not a guaranteed profit: it can still be a fake, the wrong size, or a stale
            listing.
          </p>
        </header>

        {signals.length > 0 ? (
          <div className="arb-list">
            {signals.map((s) => (
              <ViewTransitionLink
                key={s.active_id}
                className="arb-row"
                href={`/piece/${encodeURIComponent(s.canonical_key)}`}
              >
                <div className="arb-identity">
                  <span className="arb-kicker">
                    {s.archetype ?? "piece"} · {s.marketplace} · {s.grade_norm}
                  </span>
                  <span className="serif arb-name">
                    {displayBrand(s.brand_norm)}
                    {s.model_name ? ` ${s.model_name}` : ""}
                  </span>
                  {s.raw_title ? (
                    <span className="t-caption ink-faint">{s.raw_title}</span>
                  ) : null}
                  {s.n_listings > 1 ? (
                    <span className="t-caption arb-multi">
                      {formatInt(s.n_listings)} listings at this ask
                    </span>
                  ) : null}
                </div>
                <div className="arb-metrics">
                  <div className="arb-metric">
                    <span className="arb-label">Ask</span>
                    <span className="mono arb-value">{formatUsd(s.ask_price_usd)}</span>
                  </div>
                  <div className="arb-metric">
                    <span className="arb-label">Sold median</span>
                    <span className="mono arb-value">{formatUsd(s.median_usd)}</span>
                  </div>
                  <div className="arb-metric">
                    <span className="arb-label">Under</span>
                    <span className="mono arb-value arb-under">
                      {formatRatioPct(s.discount_vs_median)}
                    </span>
                  </div>
                  <div className="arb-metric">
                    <span className="arb-label">Comps</span>
                    <span className="mono arb-value">{formatInt(s.n_sold)}</span>
                  </div>
                  <ConfidenceBadge grade={s.confidence_grade} />
                </div>
              </ViewTransitionLink>
            ))}
          </div>
        ) : (
          <div className="prose measure ink-2">
            <p>
              No active ask currently clears the bar: at least 15% below the median of its
              same-condition comps, from a piece with enough tight same-grade sales to trust.
              Active listings are loaded and scanned; nothing qualifies right now.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
