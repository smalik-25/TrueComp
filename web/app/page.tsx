import { Container } from "@/components/Container";
import { Wordmark } from "@/components/Wordmark";
import { KickerLabel } from "@/components/KickerLabel";
import { Button } from "@/components/Button";

// Phase 1 places a spare shell at the root so the app runs and the nav, grain,
// and tokens are visible in context. This is not the landing page: the real
// hero, live stat strip, and search entry come after the piece-detail page is
// reviewed. The styleguide is the deliverable for this phase.
export default function Home() {
  return (
    <Container>
      <div className="stack-6" style={{ paddingBlock: "var(--space-8)" }}>
        <KickerLabel>Design system in place</KickerLabel>
        <Wordmark style={{ fontSize: "var(--t-display)" }} />
        <p className="t-h2 serif measure ink-2">
          Find what a piece is worth, not what it is listed at.
        </p>
        <p className="mono t-small ink-3">
          Sold comps resolved across Grailed and eBay, graded by sample size.
        </p>
        <div className="sg-row">
          <Button href="/styleguide" primary>
            View the styleguide
          </Button>
        </div>
      </div>
    </Container>
  );
}
