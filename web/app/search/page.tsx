import type { Metadata } from "next";
import { getAllPieces } from "@/lib/queries/pieces";
import { Container } from "@/components/Container";
import { KickerLabel } from "@/components/KickerLabel";
import { SearchBrowse } from "@/components/SearchBrowse";

export const metadata: Metadata = { title: "Search" };
export const revalidate = 86400;

// The corpus is small, so the server fetches every piece once and the client
// filters instantly. No separate search mart is needed.
export default async function SearchPage() {
  const pieces = await getAllPieces();
  return (
    <Container>
      <header className="stack-3" style={{ paddingBlock: "var(--space-6)" }}>
        <KickerLabel>Browse the corpus</KickerLabel>
        <h1 className="t-h1">Search pieces</h1>
        <p className="t-body measure ink-2">
          Every resolved piece, richest first. Filter by brand, archetype, or season, or search a
          model. Each card carries its median, comp count, and confidence grade.
        </p>
      </header>
      <SearchBrowse pieces={pieces} />
    </Container>
  );
}
