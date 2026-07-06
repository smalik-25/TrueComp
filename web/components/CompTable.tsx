"use client";

import { useState, useMemo } from "react";
import type { Sale } from "@/lib/queries/detail";
import { formatUsd } from "@/lib/format";
import { SourceTag } from "./SourceTag";
import { useHighlight, priceInRange } from "./highlight";

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

function sourceLabel(m: string): string {
  if (m === "ebay") return "eBay";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

const PAGE = 25;

export function CompTable({ sales }: { sales: Sale[] }) {
  const [key, setKey] = useState<SortKey>("price");
  const [dir, setDir] = useState<Dir>("desc");
  const [source, setSource] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE);
  const { range, setRange } = useHighlight();

  const sources = useMemo(() => Array.from(new Set(sales.map((s) => s.marketplace))), [sales]);

  const sorted = useMemo(() => {
    const rows = sales.filter((s) => source === "all" || s.marketplace === source);
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
  }, [sales, key, dir, source]);

  const shown = sorted.slice(0, visible);

  const sortBy = (k: SortKey) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setKey(k);
      setDir(k === "marketplace" ? "asc" : "desc");
    }
    setVisible(PAGE);
  };

  const pickSource = (s: string) => {
    setSource(s);
    setVisible(PAGE);
  };

  const ariaSort = (k: SortKey) => (key === k ? (dir === "asc" ? "ascending" : "descending") : "none");
  const caret = (k: SortKey) => (key === k ? (dir === "asc" ? "↑" : "↓") : "");

  return (
    <div className="comp-section">
      {sources.length > 1 ? (
        <div className="comp-toolbar" role="group" aria-label="Filter comps by source">
          <button
            type="button"
            className="comp-source-btn"
            data-on={source === "all"}
            onClick={() => pickSource("all")}
          >
            All
          </button>
          {sources.map((s) => (
            <button
              key={s}
              type="button"
              className="comp-source-btn"
              data-on={source === s}
              onClick={() => pickSource(s)}
            >
              {sourceLabel(s)}
            </button>
          ))}
          <span className="comp-count mono">{sorted.length} comps</span>
        </div>
      ) : null}
      <div className="comp-table-wrap">
      <table className="comp-table">
        <thead>
          <tr>
            <th aria-sort={ariaSort("marketplace")}>
              <button type="button" className="th-sort" onClick={() => sortBy("marketplace")}>
                Source <span className="th-caret" aria-hidden="true">{caret("marketplace")}</span>
              </button>
            </th>
            <th className="num-col" aria-sort={ariaSort("price")}>
              <button type="button" className="th-sort" onClick={() => sortBy("price")}>
                Price <span className="th-caret" aria-hidden="true">{caret("price")}</span>
              </button>
            </th>
            <th aria-sort={ariaSort("date")}>
              <button type="button" className="th-sort" onClick={() => sortBy("date")}>
                Sold <span className="th-caret" aria-hidden="true">{caret("date")}</span>
              </button>
            </th>
            <th>Reliability</th>
            <th>Listing title</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((s) => {
            const price = Number(s.sold_price_usd);
            return (
            <tr
              key={s.sold_id}
              data-hot={priceInRange(price, range)}
              onMouseEnter={() => setRange({ lo: price, hi: price })}
              onMouseLeave={() => setRange(null)}
            >
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
            );
          })}
        </tbody>
      </table>
      </div>
      {visible < sorted.length ? (
        <div className="comp-pager">
          <button type="button" className="comp-more" onClick={() => setVisible((v) => v + PAGE)}>
            Show {Math.min(PAGE, sorted.length - visible)} more
          </button>
          <span className="mono ink-3">
            {shown.length} of {sorted.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}
