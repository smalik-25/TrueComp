import { getSiteStats } from "@/lib/queries/stats";
import { Container } from "@/components/Container";
import { Wordmark } from "@/components/Wordmark";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { StatBlock } from "@/components/StatBlock";
import { Button } from "@/components/Button";
import { HeroMotif } from "@/components/HeroMotif";
import { CountUp } from "@/components/CountUp";

export const revalidate = 86400;

// The landing. A typographic hero over the generative point-field motif (Canvas
// 2D, static under reduced-motion), a live stat strip that counts up on first
// view, and a plain statement of what the tool does and does not claim.
export default async function Home() {
  const stats = await getSiteStats();
  return (
    <Container>
      <section className="hero">
        <HeroMotif />
        <div className="hero-content">
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
        </div>
      </section>

      <SectionRule label="Where it stands" />
      <div className="stat-strip">
        <StatBlock value={<CountUp value={stats.pieces} kind="int" />} label="Pieces tracked" />
        <StatBlock value={<CountUp value={stats.sold_rows} kind="int" />} label="Sold comps" accent />
        <StatBlock value={<CountUp value={stats.marketplaces} kind="int" />} label="Marketplaces" />
        <StatBlock
          value={<CountUp value={stats.cross_market_pieces} kind="int" />}
          label="Cross-market pieces"
        />
      </div>

      <SectionRule label="What this is" />
      <div className="prose measure">
        <p>
          A sold-comparables and repricing tool for archive and avant-garde menswear. The hard part
          is not scraping, it is resolving the same piece across marketplaces that share no common
          key. Every number on the site traces to a sold record.
        </p>
        <p>
          The sold-comps corpus spans about five hundred resolved pieces. Visual search on Identify
          is narrower on purpose: it matches against eighteen reference grails it has been given
          images of, and says so rather than guessing at anything outside that set.
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
