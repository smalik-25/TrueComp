import { formatUsd, formatInt } from "@/lib/format";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ViewTransitionLink } from "./ViewTransitionLink";

// Typographic piece card: no image is assumed (section 3.1). Brand and model
// are serif (they name a relic); every number is mono. Routes on canonical_key,
// the stable dedup key, never piece_id which churns on each resolver run.
type Grade = "A" | "B" | "C" | "D";

export function PieceCard({
  canonicalKey,
  brand,
  model,
  season,
  medianUsd,
  nSold,
  grade,
}: {
  canonicalKey?: string;
  brand: string;
  model?: string | null;
  season?: string | null;
  medianUsd: string | number;
  nSold: string | number;
  grade: Grade;
}) {
  const body = (
    <>
      <div className="stack-2">
        <span className="piece-card-brand">{brand}</span>
        <span className="piece-card-model">
          {model ?? "Unspecified model"}
          {season ? <span className="mono ink-3"> · {season}</span> : null}
        </span>
      </div>
      <div className="piece-card-meta">
        <div className="piece-card-metric">
          <span className="piece-card-metric-label">Median</span>
          <span className="piece-card-metric-value">{formatUsd(medianUsd)}</span>
        </div>
        <div className="piece-card-metric">
          <span className="piece-card-metric-label">Comps</span>
          <span className="piece-card-metric-value">{formatInt(nSold)}</span>
        </div>
        <div className="piece-card-metric">
          <span className="piece-card-metric-label">Conf</span>
          <ConfidenceBadge grade={grade} />
        </div>
      </div>
    </>
  );

  if (canonicalKey) {
    return (
      <ViewTransitionLink className="piece-card" href={`/piece/${encodeURIComponent(canonicalKey)}`}>
        {body}
      </ViewTransitionLink>
    );
  }
  return <div className="piece-card">{body}</div>;
}
