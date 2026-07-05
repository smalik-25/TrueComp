"use client";

import { createContext, useContext, useState } from "react";

// Shared hover state connecting the distribution to the comps table (section
// 6.5). The shared value is a price RANGE: a comp row hovers a single price, a
// histogram bar hovers its bucket. Each side highlights what overlaps.
//
// Fail-safe: useHighlight returns a no-op default when there is no provider, so
// the histogram and the comps table both work standalone (they simply do not
// cross-highlight), and nothing throws.
export type Range = { lo: number; hi: number } | null;

type Ctx = { range: Range; setRange: (r: Range) => void };

const HighlightCtx = createContext<Ctx | null>(null);

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<Range>(null);
  return <HighlightCtx.Provider value={{ range, setRange }}>{children}</HighlightCtx.Provider>;
}

export function useHighlight(): Ctx {
  return useContext(HighlightCtx) ?? { range: null, setRange: () => {} };
}

// A price is highlighted when it falls inside the hovered range.
export function priceInRange(price: number, range: Range): boolean {
  return range !== null && price >= range.lo && price <= range.hi;
}

// A bin is highlighted when it overlaps the hovered range at all. Inclusive of
// both bounds, matching priceInRange, so the top-priced comp row (whose price
// equals the last bin's x1) lights that last bar, and the two directions agree.
export function binInRange(x0: number, x1: number, range: Range): boolean {
  return range !== null && range.lo <= x1 && range.hi >= x0;
}
