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
  archetype,
  model,
  season,
  medianUsd,
  p10Usd,
  p90Usd,
  nSold,
  grade,
}: {
  canonicalKey?: string;
  brand: string;
  archetype?: string | null;
  model?: string | null;
  season?: string | null;
  medianUsd: string | number;
  p10Usd?: string | number | null;
  p90Usd?: string | number | null;
  nSold: string | number;
  grade: Grade;
}) {
  const body = (
    <>
      <div className="piece-card-identity">
        {archetype ? <span className="piece-card-kicker">{archetype}</span> : null}
        <span className="piece-card-brand">{brand}</span>
        {model ? (
          <span className="piece-card-model">
            {model}
            {season ? <span className="mono ink-3"> · {season}</span> : null}
          </span>
        ) : season ? (
          <span className="piece-card-model mono ink-3">{season}</span>
        ) : null}
      </div>
      <div className="piece-card-meta">
        <div className="piece-card-metric">
          <span className="piece-card-metric-label">Median</span>
          <span className="piece-card-metric-value">{formatUsd(medianUsd)}</span>
          {p10Usd && p90Usd ? (
            <span className="piece-card-range">
              {formatUsd(p10Usd)} to {formatUsd(p90Usd)}
            </span>
          ) : null}
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
