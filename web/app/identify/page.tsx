import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { VisualSearch } from "@/components/VisualSearch";

export const metadata: Metadata = {
  title: "Identify",
  description:
    "Upload a photo of an archive grail and get an honest, confidence-graded identification with real sold comps.",
};

export default function IdentifyPage() {
  return (
    <Container>
      <div className="stack-4" style={{ paddingBlock: "var(--space-7)" }}>
        <header className="stack-3">
          <KickerLabel>Zero-shot visual search</KickerLabel>
          <h1 className="serif" style={{ fontSize: "var(--t-display)", lineHeight: 1.05 }}>
            Identify
          </h1>
          <p className="prose measure ink-2">
            Upload a photo and match it against the reference set of eighteen archive grails. It
            returns the brand and type it is confident about, the exact model only as a hedge, and
            the nearest resolved pieces with their real sold comps. If your piece is not one of the
            eighteen, it says so rather than forcing a guess. No fine-tuning: this is off-the-shelf
            image similarity, graded honestly.
          </p>
        </header>

        <VisualSearch />
      </div>
    </Container>
  );
}
