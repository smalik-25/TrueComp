import type { Metadata } from "next";
import { getSiteStats } from "@/lib/queries/stats";
import { formatInt } from "@/lib/format";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { PullQuote } from "@/components/PullQuote";
import { MethodReveal } from "@/components/MethodReveal";
import { MethodStep } from "@/components/MethodStep";
import { PipelineDiagram } from "@/components/PipelineDiagram";
import { ResolutionExample } from "@/components/ResolutionExample";
import { ModelErrorPanel } from "@/components/ModelErrorPanel";

export const metadata: Metadata = { title: "Method" };
export const revalidate = 86400;

const LIMITS = [
  "Grailed comps are undated, so they set price level, never timing.",
  "Velocity is eBay-only, because eBay carries the only trusted sold date.",
  "Days-to-sell is not derivable from sold comps and is never shown.",
  "Thin pieces fall back to a brand-and-archetype median, and say so.",
  "Confidence is graded by sample size, next to every price.",
  "Cross-marketplace spreads appear only where they can be stood behind.",
];

export default async function MethodPage() {
  const stats = await getSiteStats();
  return (
    <Container>
      <MethodReveal>
        <header className="method-head stack-4" style={{ paddingBlock: "var(--space-7)" }}>
          <KickerLabel>The machine, honestly</KickerLabel>
          <h1 className="t-display">Method</h1>
          <p className="t-body measure ink-2">
            How a messy pile of marketplace listings becomes a price you can stand behind, and where
            the honest limits of that are. Nothing here is dressed up beyond what the data supports.
          </p>
        </header>

        <PipelineDiagram />

        <div className="method-steps">
          <MethodStep n={1} title="Sources arrive">
            <p>
              Two marketplaces feed the corpus, Grailed and eBay, pulled by Apify actors on a
              scheduled cron rather than on demand. The ingestion never runs on the site; the site
              only reads what the pipeline has already resolved and stored.
            </p>
          </MethodStep>

          <MethodStep n={2} title="Every source enters through an adapter">
            <p>
              Each marketplace speaks its own dialect, so each one passes through an adapter that
              maps its fields into a single canonical shape. eBay prices arrive as strings and are
              cast at the boundary, rows that fail to cast are rejected rather than coerced to zero,
              best-offer sales are flagged, and Grailed sold dates are dropped because they are
              scrape time, not sale time. No source-specific field leaks downstream.
            </p>
          </MethodStep>

          <MethodStep n={3} title="The hard part: resolving a piece across marketplaces">
            <p>
              Two sellers on two sites describe the same shoe in different words, with no shared
              identifier between them. Resolution is text-first: brand aliases, brand-specific model
              tokens, a garment vocabulary, and season codes combine into a stable canonical key that
              both listings land on.
            </p>
            <ResolutionExample />
          </MethodStep>

          <MethodStep n={4} title="The marts compute the bands">
            <p>
              Resolved rows roll up in dbt into per-piece marts: the median and the tenth and
              ninetieth percentiles, a best-offer-excluded median beside the all-in one, a confidence
              grade, and a recommended list price. Today that is{" "}
              <span className="num">{formatInt(stats.pieces)}</span> pieces over{" "}
              <span className="num">{formatInt(stats.sold_rows)}</span> sold comps across{" "}
              <span className="num">{formatInt(stats.marketplaces)}</span> marketplaces, with{" "}
              <span className="num">{formatInt(stats.cross_market_pieces)}</span> pieces resolved
              cleanly on both sides for a cross-marketplace spread.
            </p>
          </MethodStep>

          <MethodStep n={5} title="The model, measured against a plain baseline">
            <p>
              A price model was trained and then scored honestly against the simplest baseline, the
              brand-and-archetype median. The verdict is that it does not beat that baseline in any
              way that matters, and saying so plainly is the point.
            </p>
            <ModelErrorPanel />
          </MethodStep>
        </div>

        <SectionRule label="What it will not claim" />
        <PullQuote>The credibility rests on not overstating what the data supports.</PullQuote>
        <ul className="limits reveal">
          {LIMITS.map((l) => (
            <li key={l} className="limit">
              <span className="limit-mark" aria-hidden="true" />
              {l}
            </li>
          ))}
        </ul>
      </MethodReveal>
    </Container>
  );
}
