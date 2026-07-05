// The pipeline in one line: sources, adapters, resolution, marts, site. Labels
// are mono (technical stages), connected by hairlines. Resolution is marked as
// the load-bearing step.
const STAGES = [
  { label: "Sources", detail: "Apify actors" },
  { label: "Adapters", detail: "anti-corruption" },
  { label: "Resolution", detail: "text-first match", key: true },
  { label: "Marts", detail: "dbt in Neon" },
  { label: "Site", detail: "thin read layer" },
];

export function PipelineDiagram() {
  return (
    <div className="pipeline reveal" role="img" aria-label="Pipeline: sources, adapters, resolution, marts, site">
      {STAGES.map((s, i) => (
        <div className="pipeline-stage" key={s.label} data-key={s.key ? "true" : undefined}>
          <span className="pipeline-label">{s.label}</span>
          <span className="pipeline-detail">{s.detail}</span>
          {i < STAGES.length - 1 ? <span className="pipeline-arrow" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}
