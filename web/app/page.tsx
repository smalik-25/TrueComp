import { getSiteStats } from "@/lib/queries/stats";
import { Container } from "@/components/Container";
import { Wordmark } from "@/components/Wordmark";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { StatBlock } from "@/components/StatBlock";
import { Button } from "@/components/Button";
import { formatInt } from "@/lib/format";

export const revalidate = 86400;

// The landing. A typographic hero (the WebGL hero motif is a Phase 6 polish pass;
// the static grain is its fallback and is already in place), a live stat strip,
// and a plain statement of what the tool does and does not claim.
export default async function Home() {
  const stats = await getSiteStats();
  return (
    <Container>
      <section className="hero">
        <KickerLabel>Sold comparables for archive menswear</KickerLabel>
        <Wordmark style={{ fontSize: "var(--t-display)" }} />
        <h1 className="hero-thesis">Find what a piece is worth, not what it is listed at.</h1>
        <p className="hero-method mono">
          Sold comps resolved across Grailed and eBay, deduped into pieces, graded by sample size.
        </p>
        <div className="hero-actions">
          <Button href="/search" primary>
            Search the corpus
          </Button>
          <Button href="/method">See the method</Button>
        </div>
      </section>

      <SectionRule label="Where it stands" />
      <div className="stat-strip">
        <StatBlock value={formatInt(stats.pieces)} label="Pieces tracked" />
        <StatBlock value={formatInt(stats.sold_rows)} label="Sold comps" accent />
        <StatBlock value={formatInt(stats.marketplaces)} label="Marketplaces" />
        <StatBlock value={formatInt(stats.cross_market_pieces)} label="Cross-market pieces" />
      </div>

      <SectionRule label="What this is" />
      <div className="prose measure">
        <p>
          A repricing tool for luxury, archive, and avant-garde menswear resale. The hard part is
          not scraping, it is resolving the same piece across marketplaces that share no common key.
          Every number on the site traces to a sold record.
        </p>
        <p className="ink-2">
          It does not claim a live market feed or a price oracle. Grailed comps are undated, so they
          set price level, not timing. Velocity is eBay-only. Thin pieces fall back to a
          brand-and-archetype median, and the confidence grade next to every price says how much to
          trust it.
        </p>
      </div>
    </Container>
  );
}
