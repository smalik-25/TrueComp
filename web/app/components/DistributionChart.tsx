"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  prices: number[];
  p10: number;
  median: number;
  p90: number;
};

// Bin the sold prices into a small histogram. Prices are sparse and skewed, so
// a fixed bin count over the observed range reads better than tick-aligned bins.
function bins(prices: number[], count = 12) {
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const width = Math.max((max - min) / count, 1);
  const buckets = Array.from({ length: count }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    n: 0,
  }));
  for (const price of prices) {
    const idx = Math.min(Math.floor((price - min) / width), count - 1);
    buckets[idx].n += 1;
  }
  return buckets.map((b) => ({
    label: `$${Math.round(b.x0)}`,
    mid: Math.round((b.x0 + b.x1) / 2),
    n: b.n,
  }));
}

export default function DistributionChart({ prices, p10, median, p90 }: Props) {
  const data = bins(prices);
  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <CartesianGrid stroke="#2a2e33" vertical={false} />
          <XAxis
            dataKey="mid"
            tickFormatter={(v) => `$${v}`}
            stroke="#9aa0a6"
            fontSize={11}
          />
          <YAxis allowDecimals={false} stroke="#9aa0a6" fontSize={11} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#1e2125",
              border: "1px solid #2a2e33",
              borderRadius: 8,
              color: "#e8e6e3",
            }}
            formatter={(v: number) => [`${v} sold`, "count"]}
            labelFormatter={(v) => `~$${v}`}
          />
          <Bar dataKey="n" fill="#c9a227" radius={[3, 3, 0, 0]} />
          <ReferenceLine x={Math.round(p10)} stroke="#9aa0a6" strokeDasharray="3 3" />
          <ReferenceLine x={Math.round(median)} stroke="#e8e6e3" />
          <ReferenceLine x={Math.round(p90)} stroke="#9aa0a6" strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
      <p className="note">
        Dashed lines mark P10 and P90; the solid line is the median.
      </p>
    </div>
  );
}
