"use client";

import { useState } from "react";
import { percentile, median as medianOf } from "@/lib/stats";
import { formatUsd } from "@/lib/format";
import { PriceBandChart } from "./charts/PriceBandChart";
import { Toggle } from "./Toggle";

// The price band, with the best-offer toggle. Excluding best-offer sales swaps
// the headline median to the precomputed reliable median and recomputes P10/P90
// from the fetched rows, so the band always reconciles with what is shown. The
// distribution below keeps every sale (best-offer hatched); only the band moves.
export function PriceBands({
  medianUsd,
  medianUsdReliable,
  sales,
  nBestOffer,
}: {
  medianUsd: string;
  medianUsdReliable: string | null;
  sales: { sold_price_usd: string; price_reliability: string }[];
  nBestOffer: number;
}) {
  const [reliableOnly, setReliableOnly] = useState(false);

  const allPrices = sales.map((s) => Number(s.sold_price_usd)).filter((n) => Number.isFinite(n));
  const reliablePrices = sales
    .filter((s) => s.price_reliability !== "best_offer")
    .map((s) => Number(s.sold_price_usd))
    .filter((n) => Number.isFinite(n));

  // Excluding is only meaningful when there is both something to exclude and a
  // non-empty reliable set left over. A piece whose every comp is a best-offer
  // sale has nothing to fall back to, so the toggle is not offered.
  const canExclude = nBestOffer > 0 && reliablePrices.length > 0;
  const excluding = reliableOnly && canExclude;
  const prices = excluding ? reliablePrices : allPrices;
  const p10 = percentile(prices, 0.1);
  const p90 = percentile(prices, 0.9);
  const median = excluding
    ? medianUsdReliable != null
      ? Number(medianUsdReliable)
      : medianOf(prices)
    : Number(medianUsd);

  return (
    <div className="bands">
      <div className="bands-head">
        <div className="bands-readout">
          <span className="bands-median spark">{formatUsd(median)}</span>
          <span className="statblock-label">Median{excluding ? " · reliable only" : ""}</span>
        </div>
        {canExclude ? (
          <Toggle
            label="Exclude best-offer sales"
            checked={reliableOnly}
            onChange={setReliableOnly}
          />
        ) : null}
      </div>
      <PriceBandChart p10={p10} median={median} p90={p90} />
      <p className="t-caption ink-3">
        Band spans P10 to P90 of sold price, pooling dated eBay sales with undated Grailed sales, so
        it sets price level, not timing.{" "}
        {canExclude
          ? "Best-offer sales can be excluded above; the band recomputes from the reliable comps."
          : nBestOffer > 0
            ? "Every comp here is a best-offer sale, so there is nothing to exclude."
            : "No best-offer sales for this piece."}
      </p>
    </div>
  );
}
