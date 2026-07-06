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
          <KickerLabel>Active asks under the sold floor</KickerLabel>
          <h1 className="serif" style={{ fontSize: "var(--t-display)", lineHeight: 1.05 }}>
            Underpriced now
          </h1>
          <p className="prose measure ink-2">
            Live listings priced below a piece&rsquo;s P10 sold price, ranked by how far under the
            sold median they sit. This is an ask sitting under the comp floor, not a guaranteed
            profit: it can still be a fake, the wrong size, or a stale listing. Every row carries
            the comp count and grade it rests on, and only pieces with at least three sold comps
            qualify.
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
                    {s.archetype ?? "piece"} · {s.marketplace}
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
              No active asks are sitting under a sold-comp floor right now. This view fills once an
              active-listing pull runs; the detector is live and waiting on data.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
