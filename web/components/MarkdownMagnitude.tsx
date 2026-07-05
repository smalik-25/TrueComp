import type { Markdown } from "@/lib/queries/detail";
import { formatRatioPct, formatCount } from "@/lib/format";
import { SourceTag } from "./SourceTag";

// Markdown magnitude, not a decay curve. Median and P90 of the ask-to-sold gap.
// Grailed is undated and price drops are not stored, so this is how much sellers
// come down, not how the price falls over days. Grailed-driven, often absent.
export function MarkdownMagnitude({ markdown }: { markdown: Markdown | null }) {
  if (!markdown || markdown.n_with_markdown === 0) {
    return (
      <p className="section-note">
        No ask-to-sold gap recorded for this piece. Markdown reads from Grailed listings that carry
        both an ask and a sold price.
      </p>
    );
  }
  return (
    <div className="stat-row">
      <div className="statblock">
        <span className="statblock-value">{formatRatioPct(markdown.median_markdown_pct)}</span>
        <span className="statblock-label">Median markdown</span>
      </div>
      <div className="statblock">
        <span className="statblock-value">{formatRatioPct(markdown.p90_markdown_pct)}</span>
        <span className="statblock-label">P90 markdown</span>
      </div>
      <div className="stat-window">
        <span className="statblock-label">Based on</span>
        <span className="mono">{formatCount(markdown.n_with_markdown, "listing")}</span>
      </div>
      <div className="stat-source">
        <SourceTag source="grailed" />
        <span className="t-caption ink-3">How far sellers come down, not a decay over days.</span>
      </div>
    </div>
  );
}
