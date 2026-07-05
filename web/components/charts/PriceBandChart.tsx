import { scaleLinear } from "@visx/scale";
import { formatUsd } from "@/lib/format";

// A horizontal price band: P10 to P90 as a bar, the median as an oxblood tick.
// visx supplies the scale; the marks are hand-drawn for full control. Pure SVG,
// so it renders server-side with no client JS. Axis and labels are mono. The
// accessible name plus the sr-only readout carry the numbers without the canvas.
export function PriceBandChart({
  p10,
  median,
  p90,
  label = "Sold price band",
}: {
  p10: number;
  median: number;
  p90: number;
  label?: string;
}) {
  const W = 760;
  const H = 132;
  const m = { top: 40, right: 24, bottom: 36, left: 24 };
  const innerW = W - m.left - m.right;
  const lo = Math.min(p10, median);
  const hi = Math.max(p90, median);
  const pad = (hi - lo) * 0.12 || hi * 0.1 || 10;
  const x = scaleLinear({ domain: [lo - pad, hi + pad], range: [0, innerW] });
  const cy = m.top + 18;
  const ticks = x.ticks(5);

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${label}. P10 ${formatUsd(p10)}, median ${formatUsd(median)}, P90 ${formatUsd(p90)}.`}
      >
        <g transform={`translate(${m.left},0)`}>
          {/* baseline track */}
          <line x1={0} x2={innerW} y1={cy} y2={cy} stroke="var(--rule)" strokeWidth={1} />
          {/* P10 to P90 band */}
          <rect
            x={x(p10)}
            y={cy - 9}
            width={Math.max(1, x(p90) - x(p10))}
            height={18}
            fill="var(--ink-secondary)"
            opacity={0.18}
          />
          <line x1={x(p10)} x2={x(p10)} y1={cy - 9} y2={cy + 9} stroke="var(--ink-secondary)" strokeWidth={1.5} />
          <line x1={x(p90)} x2={x(p90)} y1={cy - 9} y2={cy + 9} stroke="var(--ink-secondary)" strokeWidth={1.5} />
          {/* median */}
          <line x1={x(median)} x2={x(median)} y1={cy - 18} y2={cy + 18} stroke="var(--blood)" strokeWidth={2.5} />
          {/* end + median labels */}
          <text x={x(p10)} y={cy - 16} textAnchor="middle" className="chart-label">{formatUsd(p10)}</text>
          <text x={x(median)} y={cy + 32} textAnchor="middle" className="chart-label chart-label--accent">
            {formatUsd(median)}
          </text>
          <text x={x(p90)} y={cy - 16} textAnchor="middle" className="chart-label">{formatUsd(p90)}</text>
          {/* axis ticks */}
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - 10} textAnchor="middle" className="chart-tick">
              {formatUsd(t)}
            </text>
          ))}
        </g>
      </svg>
      <figcaption className="sr-only">
        Sold price band. P10 {formatUsd(p10)}, median {formatUsd(median)}, P90 {formatUsd(p90)}.
      </figcaption>
    </figure>
  );
}
