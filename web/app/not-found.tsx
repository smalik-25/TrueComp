import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <Container>
      <div style={{ paddingBlock: "var(--space-9)" }}>
        <EmptyState title="Page not found" body="The page you were after is not here.">
          <Button href="/" primary>
            Back to the start
          </Button>
        </EmptyState>
      </div>
    </Container>
  );
}
