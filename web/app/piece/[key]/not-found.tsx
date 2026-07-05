import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function PieceNotFound() {
  return (
    <Container>
      <div style={{ paddingBlock: "var(--space-8)" }}>
        <EmptyState
          title="No such piece"
          body="This piece is not in the corpus, or it churned to a new key on the last resolver run. Try searching for the brand or model."
        >
          <Button href="/search" primary>
            Search pieces
          </Button>
        </EmptyState>
      </div>
    </Container>
  );
}
