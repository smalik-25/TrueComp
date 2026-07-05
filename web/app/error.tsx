"use client";

import { Container } from "@/components/Container";
import { ErrorPanel } from "@/components/ErrorPanel";
import { Button } from "@/components/Button";

// Global error boundary. Plain and honest: the marts may be mid-refresh or Neon
// may be waking from autosuspend. Offers a retry.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container>
      <div style={{ paddingBlock: "var(--space-9)" }}>
        <ErrorPanel message="The data layer returned an error. Neon may be waking from autosuspend, or the marts may be mid-refresh.">
          <Button onClick={reset}>Try again</Button>
        </ErrorPanel>
      </div>
    </Container>
  );
}
