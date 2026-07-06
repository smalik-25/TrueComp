import { Container } from "./Container";
import { Wordmark } from "./Wordmark";
import { getLatestSold } from "@/lib/queries/stats";

// Footer: the wordmark, a plain honest scope note, the source credit with an
// eBay-dated-through date, and the maker line. No buzzwords, no claims the data
// cannot support. Rendered on every page via the root layout.
export async function Footer() {
  const latestSold = await getLatestSold();
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
            <p className="footer-sig">
              Built in the ruins of the present
              <br />
              Sam Malik |{" "}
              <a href="https://sam-malik.com" target="_blank" rel="noopener noreferrer">
                sam-malik.com
              </a>
            </p>
          </div>
          <p className="footer-note mono">
            Sources: Grailed, eBay
            <br />
            Refreshed on the ingestion cron
            {latestSold ? (
              <>
                <br />
                eBay comps dated through {latestSold}
              </>
            ) : null}
          </p>
        </div>
      </Container>
    </footer>
  );
}
