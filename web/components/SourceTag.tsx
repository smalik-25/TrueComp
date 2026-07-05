// A marketplace tag in mono, carrying its viz color plus a shape cue so the
// source is never distinguished by color alone (colorblind-safe): eBay is a
// slate circle, Grailed an oxblood square, Yahoo a brass diamond. Yahoo is
// reserved; it is not in the data yet.
type Source = "ebay" | "grailed" | "yahoo";

const LABEL: Record<Source, string> = {
  ebay: "eBay",
  grailed: "Grailed",
  yahoo: "Yahoo JP",
};

export function SourceTag({ source }: { source: Source }) {
  return (
    <span className={`source-tag source-tag--${source}`}>
      <span className="source-tag-dot" aria-hidden="true" />
      {LABEL[source]}
    </span>
  );
}
