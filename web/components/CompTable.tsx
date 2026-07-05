"use client";

import { useState, useMemo } from "react";
import type { Sale } from "@/lib/queries/detail";
import { formatUsd } from "@/lib/format";
import { SourceTag } from "./SourceTag";

// The underlying sold listings, mono throughout. Grailed rows show "undated"
// rather than inventing a date. Best-offer sales are flagged. No condition
// column: int_sold_clean carries no per-row condition, so it is not shown rather
// than faked. Sortable client-side by price, date, or marketplace.
type SortKey = "price" | "date" | "marketplace";
type Dir = "asc" | "desc";

function marketplaceSource(m: string): "ebay" | "grailed" | "yahoo" {
  if (m === "ebay") return "ebay";
  if (m === "grailed") return "grailed";
  return "yahoo";
}

export function CompTable({ sales }: { sales: Sale[] }) {
  const [key, setKey] = useState<SortKey>("price");
  const [dir, setDir] = useState<Dir>("desc");

  const sorted = useMemo(() => {
    const rows = [...sales];
    const sign = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (key === "price") return sign * (Number(a.sold_price_usd) - Number(b.sold_price_usd));
      if (key === "marketplace") return sign * a.marketplace.localeCompare(b.marketplace);
      // date: nulls (undated Grailed) always sort to the bottom
      if (a.sold_date === null && b.sold_date === null) return 0;
      if (a.sold_date === null) return 1;
      if (b.sold_date === null) return -1;
      return sign * a.sold_date.localeCompare(b.sold_date);
    });
    return rows;
  }, [sales, key, dir]);

  const sortBy = (k: SortKey) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setKey(k);
      setDir(k === "marketplace" ? "asc" : "desc");
    }
  };

  const ariaSort = (k: SortKey) => (key === k ? (dir === "asc" ? "ascending" : "descending") : "none");
  const caret = (k: SortKey) => (key === k ? (dir === "asc" ? "↑" : "↓") : "");

  return (
    <div className="comp-table-wrap">
      <table className="comp-table">
        <thead>
          <tr>
            <th aria-sort={ariaSort("marketplace")}>
              <button type="button" className="th-sort" onClick={() => sortBy("marketplace")}>
                Source <span className="th-caret">{caret("marketplace")}</span>
              </button>
            </th>
            <th className="num-col" aria-sort={ariaSort("price")}>
              <button type="button" className="th-sort" onClick={() => sortBy("price")}>
                Price <span className="th-caret">{caret("price")}</span>
              </button>
            </th>
            <th aria-sort={ariaSort("date")}>
              <button type="button" className="th-sort" onClick={() => sortBy("date")}>
                Sold <span className="th-caret">{caret("date")}</span>
              </button>
            </th>
            <th>Reliability</th>
            <th>Listing title</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.sold_id}>
              <td>
                <SourceTag source={marketplaceSource(s.marketplace)} />
              </td>
              <td className="num-col mono">{formatUsd(s.sold_price_usd)}</td>
              <td className="mono">{s.sold_date ?? <span className="ink-3">undated</span>}</td>
              <td>
                {s.price_reliability === "best_offer" ? (
                  <span className="flag flag--bo">best offer</span>
                ) : (
                  <span className="mono ink-3">reliable</span>
                )}
              </td>
              <td className="comp-title mono" title={s.raw_title}>
                {s.raw_title}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
