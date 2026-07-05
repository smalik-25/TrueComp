// The model, evaluated honestly. It does not beat the brand-and-archetype median
// yet, and that candor is the point. Figures are snapshotted from the pipeline's
// stdout evaluation (they are not persisted anywhere the site can read live), so
// they are labeled as measured, not presented as a live metric.
export function ModelErrorPanel() {
  return (
    <div className="model-panel reveal">
      <div className="model-panel-stats">
        <div className="statblock">
          <span className="statblock-value">~$240</span>
          <span className="statblock-label">Model MAE</span>
        </div>
        <div className="statblock">
          <span className="statblock-value">~$240</span>
          <span className="statblock-label">Median baseline MAE</span>
        </div>
        <div className="statblock statblock--accent">
          <span className="statblock-value">~1%</span>
          <span className="statblock-label">Lift over baseline</span>
        </div>
      </div>
      <p className="model-panel-read measure">
        A LightGBM regressor, scored under group cross-validation by piece so it is always judged on
        pieces it never saw. It lands within about a percent of the plain brand-and-archetype median,
        which is to say it has no edge yet. The comps mart already recommends off that same median,
        so nothing is lost by admitting it. The model is a proof of the pipeline, not a price oracle;
        it earns its keep only once the corpus is broadened and deepened.
      </p>
      <p className="t-caption ink-faint">
        Measured on the current corpus under GroupKFold by piece. Printed by the pipeline, not
        persisted; shown here as a snapshot, not a live figure.
      </p>
    </div>
  );
}
