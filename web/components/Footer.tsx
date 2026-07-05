import { Container } from "./Container";
import { Wordmark } from "./Wordmark";

// Footer: the wordmark, a plain honest scope note, and the source credit. No
// buzzwords, no claims the data cannot support.
export function Footer() {
  return (
    <footer className="footer">
      <Container>
        <div className="footer-inner">
          <div className="stack-3">
            <Wordmark variant="nav" href="/" />
            <p className="footer-note">
              Sold-comparable prices for archive and avant-garde menswear, resolved across
              marketplaces. Every figure traces to a sold record. Confidence is graded by sample
              size, not asserted.
            </p>
          </div>
          <p className="footer-note mono">
            Sources: Grailed, eBay
            <br />
            Refreshed on the ingestion cron
          </p>
        </div>
      </Container>
    </footer>
  );
}
