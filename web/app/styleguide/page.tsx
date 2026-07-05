import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Wordmark } from "@/components/Wordmark";
import { KickerLabel } from "@/components/KickerLabel";
import { SectionRule } from "@/components/SectionRule";
import { PullQuote } from "@/components/PullQuote";
import { StatBlock } from "@/components/StatBlock";
import { SparkNumber } from "@/components/SparkNumber";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { SourceTag } from "@/components/SourceTag";
import { PieceCard } from "@/components/PieceCard";
import { BrandChip } from "@/components/BrandChip";
import { ArchetypeChip } from "@/components/ArchetypeChip";
import { SeasonChip } from "@/components/SeasonChip";
import { SearchInput } from "@/components/SearchInput";
import { SortControl } from "@/components/SortControl";
import { Toggle } from "@/components/Toggle";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ThinDataNotice } from "@/components/ThinDataNotice";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorPanel } from "@/components/ErrorPanel";
import { formatUsd, formatPct } from "@/lib/format";

export const metadata: Metadata = { title: "Styleguide" };

const SURFACES = [
  ["--surface-void", "#0B0A09"],
  ["--surface-base", "#0E0C0B"],
  ["--surface-raised", "#151210"],
  ["--surface-overlay", "#1C1815"],
  ["--rule", "#2A251F"],
  ["--rule-strong", "#3A342C"],
];
const INKS = [
  ["--ink-primary", "#E8E3D6"],
  ["--ink-secondary", "#A8A093"],
  ["--ink-tertiary", "#6E675C"],
  ["--ink-faint", "#48423A"],
];
const ACCENTS = [
  ["--blood", "#A8302E"],
  ["--blood-bright", "#C6403A"],
  ["--blood-deep", "#6E1D1C"],
];
const VIZ = [
  ["--viz-ebay", "#6C8299"],
  ["--viz-grailed", "#A8302E"],
  ["--viz-yahoo", "#9A8248"],
];

const TYPE_SCALE = [
  ["display", "--t-display", "3.5rem"],
  ["h1", "--t-h1", "2.25rem"],
  ["h2", "--t-h2", "1.5rem"],
  ["h3", "--t-h3", "1.125rem"],
  ["body", "--t-body", "1rem"],
  ["small", "--t-small", "0.875rem"],
  ["caption", "--t-caption", "0.8125rem"],
];

const MOTION = [
  ["--dur-fast", "120ms", "hovers, toggles"],
  ["--dur-base", "240ms", "most transitions"],
  ["--dur-slow", "480ms", "panel + view changes"],
  ["--dur-reveal", "800ms", "scroll reveals, chart draw-ins"],
  ["--ease-out", "cubic-bezier(0.2, 0.8, 0.2, 1)", "default"],
  ["--ease-editorial", "cubic-bezier(0.16, 1, 0.3, 1)", "weighted reveals"],
];

const DEFERRED = [
  "PriceBandChart",
  "DistributionHistogram",
  "VelocityStat",
  "MarkdownMagnitude",
  "SpreadPanel",
  "CompTable",
  "RecommendationBlock",
  "CommandSearch",
  "HeroMotif (WebGL)",
  "MethodStep",
  "PipelineDiagram",
  "FilterRail",
];

function Swatches({ rows }: { rows: string[][] }) {
  return (
    <div className="sg-swatches">
      {rows.map(([name, hex]) => (
        <div className="sg-swatch" key={name}>
          <div className="sg-swatch-chip" style={{ background: `var(${name})` }} />
          <div className="sg-swatch-meta">
            <span className="sg-swatch-name">{name}</span>
            <span className="sg-swatch-hex">{hex}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sg-cell">
      <span className="sg-cell-label">{label}</span>
      {children}
    </div>
  );
}

export default function Styleguide() {
  return (
    <Container>
      {/* Header */}
      <header className="stack-4" style={{ paddingBlock: "var(--space-6)" }}>
        <KickerLabel>Design system · Phase 1</KickerLabel>
        <h1 className="t-display">Styleguide</h1>
        <p className="t-body measure ink-2">
          The tokens, the wordmark, the type system, and every base component in isolation. The one
          rule that runs through all of it: if a thing is a relic it is serif, if a thing is a
          measurement it is mono.
        </p>
      </header>

      {/* Wordmark */}
      <section className="sg-section">
        <SectionRule label="Wordmark" />
        <div className="stack-6">
          <div className="sg-grid">
            <Cell label="Lockup">
              <Wordmark style={{ fontSize: "var(--t-display)" }} />
            </Cell>
            <Cell label="Nav variant">
              <Wordmark variant="nav" />
            </Cell>
          </div>
          <div className="sg-grid">
            <Cell label="On void surface">
              <div
                className="card"
                style={{ background: "var(--surface-void)", display: "flex", justifyContent: "center", padding: "var(--space-7)" }}
              >
                <Wordmark style={{ fontSize: "var(--t-h1)" }} />
              </div>
            </Cell>
            <Cell label="On raised surface">
              <div
                className="card"
                style={{ display: "flex", justifyContent: "center", padding: "var(--space-7)" }}
              >
                <Wordmark style={{ fontSize: "var(--t-h1)" }} />
              </div>
            </Cell>
          </div>
          <div className="sg-row">
            <Wordmark style={{ fontSize: "1rem" }} />
            <Wordmark style={{ fontSize: "1.5rem" }} />
            <Wordmark style={{ fontSize: "2.25rem" }} />
            <Wordmark style={{ fontSize: "3.5rem" }} />
          </div>
          <p className="t-small ink-3 measure">
            Query is set 0.78em against Reli, weight 450, tracking pulled in and the baseline
            nudged, so the mono does not read heavier than the serif. In the lockup Query is
            oxblood; in the nav variant it steps up to blood-bright at the smaller size.
          </p>
        </div>
      </section>

      {/* Type */}
      <section className="sg-section">
        <SectionRule label="Type · three voices" />
        <div className="stack-6">
          <div className="sg-specimen">
            <div className="sg-row">
              <span className="sg-tag">Fraunces</span>
              <span className="serif t-h1">Rick Owens Geobasket</span>
            </div>
            <div className="sg-row">
              <span className="sg-tag">Geist Mono</span>
              <span className="mono t-h1">$1,240 · P90 · FW09</span>
            </div>
            <div className="sg-row">
              <span className="sg-tag">Inter</span>
              <span className="sans t-h3">Body copy and functional interface text.</span>
            </div>
          </div>

          <div>
            <p className="sg-cell-label" style={{ marginBottom: "var(--space-4)" }}>
              Type scale
            </p>
            <div className="sg-specimen">
              {TYPE_SCALE.map(([name, varName, rem]) => (
                <div className="sg-row" key={name}>
                  <span className="sg-tag">
                    {name} · {rem}
                  </span>
                  <span
                    className={name === "body" || name === "small" || name === "caption" ? "sans" : "serif"}
                    style={{ fontSize: `var(${varName})`, lineHeight: 1.1 }}
                  >
                    Archive and avant-garde
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="sg-cell-label" style={{ marginBottom: "var(--space-3)" }}>
              The rule in one line
            </p>
            <p className="serif t-h3">
              The <span className="serif">Geobasket</span> sold for{" "}
              <span className="num">{formatUsd(1240)}</span> across{" "}
              <span className="num">18</span> comps, a{" "}
              <span className="num blood">{formatPct(73, { sign: true })}</span> premium on Grailed.
            </p>
            <p className="t-caption ink-3" style={{ marginTop: "var(--space-3)" }}>
              Names stay serif inside mono contexts; every number is mono with tabular figures.
            </p>
          </div>

          <div className="card">
            <p className="sg-cell-label" style={{ marginBottom: "var(--space-3)" }}>
              Tabular figures align in columns
            </p>
            <div className="stack-2">
              {[1240, 32.5, 980, 4200, 115].map((v, i) => (
                <div key={i} className="num" style={{ fontSize: "var(--t-h3)" }}>
                  {formatUsd(v)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Color */}
      <section className="sg-section">
        <SectionRule label="Palette" />
        <div className="stack-6">
          <Cell label="Surfaces">
            <Swatches rows={SURFACES} />
          </Cell>
          <Cell label="Ink · bone family">
            <Swatches rows={INKS} />
          </Cell>
          <Cell label="Accent · oxblood, used on ~one element per view">
            <Swatches rows={ACCENTS} />
          </Cell>
          <Cell label="Data-viz categoricals · each paired with a shape cue">
            <Swatches rows={VIZ} />
          </Cell>
        </div>
      </section>

      {/* Grid + spacing */}
      <section className="sg-section">
        <SectionRule label="Grid + spacing" />
        <div className="stack-6">
          <Cell label="12-column grid · content sits off-center in 7">
            <div className="grid-12" style={{ border: "1px solid var(--rule)", padding: "var(--space-4)" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 40,
                    background: i < 7 ? "var(--blood-deep)" : "var(--surface-overlay)",
                    border: "1px solid var(--rule)",
                  }}
                />
              ))}
            </div>
          </Cell>
          <Cell label="Editorial column · relic in 7, quiet mono margin in 4">
            <div className="grid-12" style={{ border: "1px solid var(--rule)", padding: "var(--space-4)" }}>
              <div className="col-editorial stack-2">
                <p className="serif t-h3">The relic sits in the wide editorial column.</p>
                <p className="t-small ink-2">
                  Seven of twelve, left of center, with room to breathe.
                </p>
              </div>
              <aside className="col-margin">
                <p className="mono t-caption ink-3">FW09 · n=18 · grade A</p>
              </aside>
            </div>
          </Cell>
          <Cell label="Spacing scale · 8px baseline">
            <div className="sg-row">
              {["--space-2", "--space-4", "--space-5", "--space-6", "--space-7", "--space-8"].map((s) => (
                <div key={s} className="stack-2">
                  <div style={{ width: `var(${s})`, height: 24, background: "var(--blood)" }} />
                  <span className="sg-swatch-hex">{s}</span>
                </div>
              ))}
            </div>
          </Cell>
        </div>
      </section>

      {/* Motion */}
      <section className="sg-section">
        <SectionRule label="Motion" />
        <div className="sg-specimen">
          {MOTION.map(([name, val, use]) => (
            <div className="sg-row" key={name}>
              <span className="sg-tag mono">{name}</span>
              <span className="mono t-small">{val}</span>
              <span className="t-small ink-3">{use}</span>
            </div>
          ))}
          <p className="t-caption ink-3 measure">
            Everything animatable is opacity and transform only. prefers-reduced-motion disables all
            of it: charts render final state, counters show final values, grain turns off.
          </p>
        </div>
      </section>

      {/* Components */}
      <section className="sg-section">
        <SectionRule label="Base components" />
        <div className="sg-grid">
          <Cell label="StatBlock">
            <div className="sg-row">
              <StatBlock value="3,645" label="Sold comps" />
              <StatBlock value="410" label="Pieces" accent />
            </div>
          </Cell>
          <Cell label="SparkNumber">
            <SparkNumber value={formatUsd(1240)} className="statblock-value" />
          </Cell>
          <Cell label="ConfidenceBadge · ink weight, not color">
            <div className="sg-row">
              <ConfidenceBadge grade="A" caption="18 comps" />
              <ConfidenceBadge grade="B" />
              <ConfidenceBadge grade="C" />
              <ConfidenceBadge grade="D" />
            </div>
          </Cell>
          <Cell label="SourceTag · color + shape cue">
            <div className="sg-row">
              <SourceTag source="ebay" />
              <SourceTag source="grailed" />
              <SourceTag source="yahoo" />
            </div>
          </Cell>
          <Cell label="PieceCard · well-backed">
            <PieceCard brand="Rick Owens" model="Geobasket" season="FW09" medianUsd={1240} nSold={18} grade="A" />
          </Cell>
          <Cell label="PieceCard · thin">
            <PieceCard brand="Julius" model={null} medianUsd={32.5} nSold={3} grade="C" />
          </Cell>
          <Cell label="Chips · Brand / Archetype / Season">
            <div className="sg-row">
              <BrandChip brand="Rick Owens" count={128} active />
              <BrandChip brand="Raf Simons" count={64} />
              <ArchetypeChip archetype="Sneaker" count={92} />
              <ArchetypeChip archetype="Leather jacket" count={31} />
              <SeasonChip season="FW09" count={12} active />
              <SeasonChip season="SS03" count={7} />
            </div>
          </Cell>
          <Cell label="SearchInput">
            <SearchInput />
          </Cell>
          <Cell label="SortControl">
            <SortControl />
          </Cell>
          <Cell label="Buttons">
            <div className="sg-row">
              <Button>Secondary</Button>
              <Button primary>Primary</Button>
            </div>
          </Cell>
          <Cell label="Toggle · best-offer">
            <Toggle label="Include best-offer sales" defaultOn />
          </Cell>
          <Cell label="KickerLabel">
            <KickerLabel>The answer, graded</KickerLabel>
          </Cell>
          <Cell label="PullQuote">
            <PullQuote>The hard part is resolving the same piece across marketplaces with no shared key.</PullQuote>
          </Cell>
          <Cell label="ThinDataNotice">
            <ThinDataNotice />
          </Cell>
          <Cell label="EmptyState">
            <EmptyState title="No comps yet" body="Try a brand or a model. Archive pieces are sparse by nature.">
              <Button primary>Browse brands</Button>
            </EmptyState>
          </Cell>
          <Cell label="LoadingSkeleton · lines">
            <LoadingSkeleton lines={3} />
          </Cell>
          <Cell label="LoadingSkeleton · card">
            <LoadingSkeleton variant="card" />
          </Cell>
          <Cell label="ErrorPanel">
            <ErrorPanel />
          </Cell>
        </div>
      </section>

      {/* SectionRule shown standalone */}
      <section className="sg-section">
        <SectionRule label="Section rule · labeled hairline divider" />
        <p className="t-small ink-3 measure">
          Structure is expressed through hairline rules like the ones above, not boxes. The label is
          mono, the line is a single --rule hairline.
        </p>
      </section>

      {/* Deferred */}
      <section className="sg-section">
        <SectionRule label="Deferred to later phases" />
        <p className="t-small ink-2 measure" style={{ marginBottom: "var(--space-4)" }}>
          These are data-bound or motion-heavy and land with the piece page, search, method, and the
          polish pass. Listed here so the styleguide is honest about what is and is not built.
        </p>
        <div className="sg-row">
          {DEFERRED.map((name) => (
            <span key={name} className="mono t-small ink-3" style={{ border: "1px solid var(--rule)", padding: "0.25em 0.6em", borderRadius: "var(--radius-sm)" }}>
              {name}
            </span>
          ))}
        </div>
      </section>
    </Container>
  );
}
