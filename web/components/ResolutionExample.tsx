import { SourceTag } from "./SourceTag";

// The hard part made visible: two messy titles from two marketplaces with no
// shared key, resolving to one canonical piece. A curated static case, not a
// live query. Raw titles are shown verbatim (source data, mono), then the
// tokens the resolver pulls, then the stable key both rows land on.
const RAW = [
  { source: "ebay" as const, title: "Maison Margiela GAT German Army Trainer Replica Sneakers 43 Cream Suede" },
  { source: "grailed" as const, title: "margiela replica gats size 10 * archive" },
];

const TOKENS = [
  { label: "brand", value: "maison margiela", note: "alias hit on a normalized token" },
  { label: "archetype", value: "footwear", note: "from the garment vocabulary" },
  { label: "model", value: "GAT", note: "brand-specific model token, from the title" },
  { label: "season", value: "none", note: "no season code present" },
];

export function ResolutionExample() {
  return (
    <div className="resolve reveal">
      <div className="resolve-inputs">
        {RAW.map((r) => (
          <div className="resolve-raw" key={r.source}>
            <SourceTag source={r.source} />
            <p className="resolve-title mono">{r.title}</p>
          </div>
        ))}
      </div>

      <div className="resolve-arrow" aria-hidden="true">
        resolves to
      </div>

      <div className="resolve-out">
        <table className="resolve-tokens">
          <tbody>
            {TOKENS.map((t) => (
              <tr key={t.label}>
                <td className="resolve-token-label">{t.label}</td>
                <td className="resolve-token-value">{t.value}</td>
                <td className="resolve-token-note">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="resolve-key">
          <span className="resolve-key-label">canonical key</span>
          <code className="resolve-key-value">maison margiela|footwear|GAT|</code>
        </div>
        <p className="t-small ink-2">
          Both rows, written by different sellers on different sites, land on the same piece. That
          join, with no shared identifier to lean on, is the whole problem the project solves.
        </p>
      </div>
    </div>
  );
}
