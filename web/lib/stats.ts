// Pure client-safe stats for the piece page. The best-offer toggle recomputes
// percentiles from the fetched rows (sanctioned by the plan), and the histogram
// bins the same rows, so bands and distribution always reconcile.

// Linear-interpolated percentile, matching Postgres percentile_cont, so the
// client-recomputed bands line up with the mart medians.
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const idx = p * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

export type Bin = {
  x0: number;
  x1: number;
  total: number;
  reliable: number;
  bestOffer: number;
};

// Fixed-count histogram over [min, max]. Each bin tracks reliable vs best-offer
// counts so the distribution can hatch the negotiated portion.
export function histogramBins(
  sales: { price: number; bestOffer: boolean }[],
  binCount = 18,
): Bin[] {
  const clean = sales.filter((s) => Number.isFinite(s.price));
  if (clean.length === 0) return [];
  const prices = clean.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) {
    return [
      {
        x0: min,
        x1: min,
        total: clean.length,
        reliable: clean.filter((s) => !s.bestOffer).length,
        bestOffer: clean.filter((s) => s.bestOffer).length,
      },
    ];
  }
  const width = (max - min) / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    total: 0,
    reliable: 0,
    bestOffer: 0,
  }));
  for (const s of clean) {
    let i = Math.floor((s.price - min) / width);
    if (i >= binCount) i = binCount - 1; // the max value lands in the last bin
    if (i < 0) i = 0;
    bins[i].total += 1;
    if (s.bestOffer) bins[i].bestOffer += 1;
    else bins[i].reliable += 1;
  }
  return bins;
}

// Which bin a price falls in, for cross-highlighting a comp row against the
// distribution. Returns -1 if the price is outside the binned range.
export function binIndexFor(price: number, bins: Bin[]): number {
  if (bins.length === 0) return -1;
  for (let i = 0; i < bins.length; i++) {
    const last = i === bins.length - 1;
    if (price >= bins[i].x0 && (price < bins[i].x1 || (last && price <= bins[i].x1))) return i;
  }
  return -1;
}
