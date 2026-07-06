import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Colophon" };

export default function ColophonPage() {
  return (
    <Container>
      <article className="colophon">
        <header className="stack-4" style={{ paddingBlock: "var(--space-7)" }}>
          <KickerLabel>The name, and how it is built</KickerLabel>
          <h1 style={{ margin: 0 }}>
            <Wordmark style={{ fontSize: "var(--t-display)" }} />
          </h1>
        </header>

        <SectionRule label="The name" />
        <div className="prose measure">
          <p>
            <span className="serif">Reli</span> is the relic, a reliquary for pieces that outlast the
            season they were made for. <span className="mono">Query</span> is the question you put to
            them: what is this actually worth. The split is not decoration. The serif carries names
            and prose, the mono carries every number, so data always reads as data.
          </p>
        </div>

        <SectionRule label="The sources" />
        <div className="prose measure">
          <p>
            Sold comps come from Grailed and eBay. Yahoo Auctions Japan is reserved for archive
            Japanese labels that barely surface on eBay, and is not in the data yet, so nothing on the
            site pretends it is.
          </p>
        </div>

        <SectionRule label="Scope" />
        <div className="prose measure">
          <p className="ink-2">
            This is a read layer over a resolved corpus, not a live market feed. Prices trace to sold
            records; confidence is graded by how many stand behind each one. Where the data cannot
            support a claim, the site says so rather than filling the gap.
          </p>
        </div>
      </article>
    </Container>
  );
}
