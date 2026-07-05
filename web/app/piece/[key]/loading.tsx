import { Container } from "@/components/Container";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function Loading() {
  return (
    <Container>
      <div className="piece stack-6" aria-busy="true" aria-label="Loading piece">
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton lines={4} />
      </div>
    </Container>
  );
}
