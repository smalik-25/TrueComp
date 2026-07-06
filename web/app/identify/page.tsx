import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { VisualSearch } from "@/components/VisualSearch";

export const metadata: Metadata = {
  title: "Identify",
  description:
    "Upload a photo of an archive grail and get an honest, confidence-graded identification with real sold comps.",
};

// The eighteen reference grails visual search can match, grouped by brand. These
// are the grail_targets that have reference images in the index; the two without
// (Undercover Nike Collab, Vetements Logo Hoodie) are left out rather than listed
// as identifiable.
const GRAILS: { brand: string; models: string[] }[] = [
  { brand: "Balenciaga", models: ["Triple S", "Speed", "Track", "Political Campaign"] },
  { brand: "Dior", models: ["Navigate", "Luster"] },
  { brand: "Maison Margiela", models: ["Tabi", "GAT", "Future"] },
  { brand: "Number (N)ine", models: ["Give Peace a Chance"] },
  { brand: "Rick Owens", models: ["Ramones", "Geobasket", "Pods"] },
  { brand: "Saint Laurent", models: ["Teddy", "L01", "Wyatt"] },
  { brand: "Undercover", models: ["Scab"] },
  { brand: "Vetements", models: ["DHL"] },
];

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

        <section className="grail-index">
          <SectionRule label="The eighteen it can identify" />
          <p className="prose measure ink-2">
            Visual search matches against these eighteen reference grails and nothing else. Upload
            one of them for a real result; upload anything outside the set and it tells you there is
            no strong match rather than guessing.
          </p>
          <div className="grail-grid">
            {GRAILS.map((g) => (
              <div key={g.brand} className="grail-brand">
                <div className="grail-brand-name">{g.brand}</div>
                <ul className="grail-models">
                  {g.models.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
