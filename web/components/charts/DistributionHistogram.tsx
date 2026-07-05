"use client";

import { scaleLinear } from "@visx/scale";
import { histogramBins, median as medianOf } from "@/lib/stats";
import { formatUsd } from "@/lib/format";
import { useHighlight, binInRange } from "../highlight";

// Histogram of individual sold prices. Reliable sales are solid ink; best-offer
// sales stack on top with a hatch cue (never color alone), so a negotiated price
// is visible but marked. Median marker in oxblood. Reads the cleaned
// intermediate so it shares the mart fences.
//
// Interactive: hovering a bar highlights its bucket and, through the shared
// highlight context, the matching rows in the comps table; when a comp row is
// hovered, its bucket lights here. Degrades to a static chart with no provider.
export function DistributionHistogram({
  points,
  binCount = 18,
}: {
  points: { price: number; bestOffer: boolean }[];
  binCount?: number;
}) {
  const { range, setRange } = useHighlight();

  if (points.length === 0) {
    return <p className="section-note">No individual sold prices to plot.</p>;
  }
  const bins = histogramBins(points, binCount);
  const med = medianOf(points.map((p) => p.price));
  const W = 760;
  const H = 280;
  const m = { top: 16, right: 24, bottom: 40, left: 40 };
  const innerW = W - m.left - m.right;
  const innerH = H - m.top - m.bottom;
  const x0 = bins[0].x0;
  const x1 = bins[bins.length - 1].x1;
  // A piece whose every sale is the same price collapses to one bin (x0 === x1);
  // pad the domain so the marker and tick are not stacked at a single point.
  const single = x0 === x1;
  const x = scaleLinear({ domain: single ? [x0 - 1, x1 + 1] : [x0, x1], range: [0, innerW] });
  const ymax = Math.max(...bins.map((b) => b.total), 1);
  const y = scaleLinear({ domain: [0, ymax], range: [innerH, 0] });
  const gap = 1.5;
  const ticks = x.ticks(6);
  const nBestOffer = points.filter((p) => p.bestOffer).length;

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Distribution of ${points.length} sold prices, median ${formatUsd(med)}${
          nBestOffer > 0 ? `, ${nBestOffer} best-offer sales hatched` : ""
        }.`}
      >
        <defs>
          <pattern id="hatch-bo" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="var(--ink-secondary)" opacity={0.18} />
            <line x1={0} y1={0} x2={0} y2={5} stroke="var(--ink-secondary)" strokeWidth={1.4} />
          </pattern>
        </defs>
        <g transform={`translate(${m.left},${m.top})`}>
          <line x1={0} x2={innerW} y1={0} y2={0} stroke="var(--rule)" strokeWidth={1} opacity={0.5} />
          <text x={-8} y={4} textAnchor="end" className="chart-tick">{ymax}</text>
          <text x={-8} y={innerH} textAnchor="end" className="chart-tick">0</text>
          {bins.map((b, i) => {
            const bx = single ? innerW / 2 - innerW * 0.15 : x(b.x0);
            const bw = single ? innerW * 0.3 : Math.max(1, x(b.x1) - x(b.x0) - gap);
            const relTop = y(b.reliable);
            const boTop = y(b.reliable + b.bestOffer);
            const hot = binInRange(b.x0, b.x1, range);
            const colX = single ? bx : x(b.x0);
            const colW = single ? bw : Math.max(1, x(b.x1) - x(b.x0));
            return (
              <g key={i}>
                {b.reliable > 0 ? (
                  <rect
                    x={bx}
                    y={relTop}
                    width={bw}
                    height={innerH - relTop}
                    fill="var(--ink-secondary)"
                    opacity={hot ? 1 : 0.7}
                  />
                ) : null}
                {b.bestOffer > 0 ? (
                  <rect x={bx} y={boTop} width={bw} height={relTop - boTop} fill="url(#hatch-bo)" />
                ) : null}
                {hot ? (
                  <rect x={bx} y={boTop} width={bw} height={innerH - boTop} fill="none" stroke="var(--blood)" strokeWidth={1} />
                ) : null}
                {/* full-height transparent hover target for the whole column */}
                {b.total > 0 ? (
                  <rect
                    x={colX}
                    y={0}
                    width={colW}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setRange({ lo: b.x0, hi: b.x1 })}
                    onMouseLeave={() => setRange(null)}
                  />
                ) : null}
              </g>
            );
          })}
          <line x1={x(med)} x2={x(med)} y1={-4} y2={innerH} stroke="var(--blood)" strokeWidth={2} />
          <text x={x(med)} y={-8} textAnchor="middle" className="chart-label chart-label--accent">
            {formatUsd(med)}
          </text>
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--rule)" strokeWidth={1} />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={innerH + 22} textAnchor="middle" className="chart-tick">
              {formatUsd(t)}
            </text>
          ))}
        </g>
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>Sold price distribution, {points.length} sales, median {formatUsd(med)}</caption>
          <thead>
            <tr>
              <th>Price range</th>
              <th>Sales</th>
              <th>Best offer</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((b, i) => (
              <tr key={i}>
                <td>
                  {formatUsd(b.x0)} to {formatUsd(b.x1)}
                </td>
                <td>{b.total}</td>
                <td>{b.bestOffer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
