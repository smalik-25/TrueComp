import { displayBrand, formatCount } from "@/lib/format";
import { SourceTag } from "./SourceTag";

// The piece identity. Brand and model are serif (relic names); archetype, size,
// season code, and counts are mono (measurements). No cover image: no piece-level
// image reaches a mart yet, so the hero is typographic (section 3.1).
function sourceOf(m: string): "ebay" | "grailed" | "yahoo" {
  if (m === "ebay") return "ebay";
  if (m === "grailed") return "grailed";
  return "yahoo";
}

export function PieceHeader({
  brand,
  model,
  archetype,
  season,
  nSold,
  nBestOffer,
  sources,
}: {
  brand: string;
  model: string | null;
  archetype: string | null;
  season: string | null;
  nSold: number;
  nBestOffer: number;
  sources: string[];
}) {
  return (
    <header className="piece-header">
      <p className="kicker">{archetype ?? "Piece"}</p>
      <h1 className="piece-header-title">
        <span className="piece-header-brand">{displayBrand(brand)}</span>
        {model ? <span className="piece-header-model">{model}</span> : null}
      </h1>
      <div className="piece-header-meta">
        {season ? <span className="mono">Season {season}</span> : null}
        <span className="mono">{formatCount(nSold, "sold comp")}</span>
        {nBestOffer > 0 ? (
          <span className="mono ink-3">{formatCount(nBestOffer, "best offer")}</span>
        ) : null}
        {sources.map((s) => (
          <SourceTag key={s} source={sourceOf(s)} />
        ))}
      </div>
    </header>
  );
}
