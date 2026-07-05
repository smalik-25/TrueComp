import Link from "next/link";
import { notFound } from "next/navigation";
import DistributionChart from "@/app/components/DistributionChart";
import {
  getMarkdown,
  getPiece,
  getSales,
  getSpread,
  getVelocity,
} from "@/lib/db";

export const dynamic = "force-dynamic";

const GRADE_NOTE: Record<string, string> = {
  A: "20+ comps",
  B: "8 to 19 comps",
  C: "3 to 7 comps",
  D: "under 3 comps; treat as indicative only",
};

function money(x: string | number | null): string {
  if (x == null) return "n/a";
  return `$${Math.round(Number(x)).toLocaleString()}`;
}

function pct(x: string | null): string {
  if (x == null) return "n/a";
  return `${(Number(x) * 100).toFixed(1)}%`;
}

export default async function PiecePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const [piece, velocity, spread, markdown, sales] = await Promise.all([
    getPiece(id),
    getVelocity(id),
    getSpread(id),
    getMarkdown(id),
    getSales(id),
  ]);

  if (!piece) notFound();

  const prices = sales.map((s) => Number(s.sold_price_usd));
  const title = piece.model_name ?? piece.archetype ?? "Unspecified piece";

  return (
    <>
      <Link href="/" className="back">
        &larr; back to search
      </Link>

      <div className="piece-head">
        <div>
          <div className="brand muted" style={{ textTransform: "uppercase" }}>
            {piece.brand_norm}
          </div>
          <h1>
            {title}
            {piece.season_code ? (
              <span className="muted"> · {piece.season_code}</span>
            ) : null}
          </h1>
          <div className="muted">
            {piece.archetype ?? "archetype unresolved"} · {piece.n_sold} sold
            comps across both marketplaces
          </div>
        </div>
        <span className={`badge ${piece.confidence_grade}`}>
          Grade {piece.confidence_grade}
        </span>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="label">Recommended list</div>
          <div className="value">{money(piece.recommended_list_price)}</div>
          <div className="sub">
            {piece.recommended_basis === "piece"
              ? "from this piece's comps"
              : "brand + archetype fallback (thin piece)"}
          </div>
        </div>
        <div className="tile">
          <div className="label">Median sold</div>
          <div className="value">{money(piece.median_usd)}</div>
          <div className="sub">
            reliable-only {money(piece.median_usd_reliable)}
          </div>
        </div>
        <div className="tile">
          <div className="label">P10 &ndash; P90</div>
          <div className="value">
            {money(piece.p10_usd)}&nbsp;&ndash;&nbsp;{money(piece.p90_usd)}
          </div>
          <div className="sub">middle 80% of sales</div>
        </div>
        <div className="tile">
          <div className="label">Confidence</div>
          <div className="value">{piece.confidence_grade}</div>
          <div className="sub">{GRADE_NOTE[piece.confidence_grade]}</div>
        </div>
      </div>

      <div className="panel">
        <h2>Sold distribution (both marketplaces, undated)</h2>
        <DistributionChart
          prices={prices}
          p10={Number(piece.p10_usd)}
          median={Number(piece.median_usd)}
          p90={Number(piece.p90_usd)}
        />
        {piece.n_best_offer > 0 ? (
          <p className="note">
            {piece.n_best_offer} of {piece.n_sold} were best-offer sales, where
            the shown price can understate the deal. The reliable-only median
            above excludes them.
          </p>
        ) : null}
      </div>

      <div className="panel">
        <h2>Velocity (eBay-driven)</h2>
        {velocity ? (
          <>
            <div className="kv">
              <span className="muted">Sold per week</span>
              <span>{Number(velocity.sold_per_week).toFixed(1)}</span>
            </div>
            <div className="kv">
              <span className="muted">eBay comps</span>
              <span>{velocity.n_sold_ebay}</span>
            </div>
            <div className="kv">
              <span className="muted">Observed window</span>
              <span>
                {velocity.first_sold} &rarr; {velocity.last_sold} (
                {velocity.span_days}d)
              </span>
            </div>
            <p className="note">
              Rate over the observed window only. Days-to-sell is not derivable
              from eBay sold comps (no listing-start date).
            </p>
          </>
        ) : (
          <p className="muted">
            No dated eBay sales for this piece, so no time-series. Grailed comps
            are undated and inform price level only.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Cross-marketplace spread</h2>
        {spread ? (
          <>
            <div className="kv">
              <span className="muted">Grailed median</span>
              <span>
                {money(spread.grailed_median)} ({spread.grailed_n})
              </span>
            </div>
            <div className="kv">
              <span className="muted">eBay median</span>
              <span>
                {money(spread.ebay_median)} ({spread.ebay_n})
              </span>
            </div>
            <div className="kv">
              <span className="muted">Spread</span>
              <span className={Number(spread.spread_usd) < 0 ? "neg" : "pos"}>
                {money(spread.spread_usd)}{" "}
                {spread.spread_pct != null
                  ? `(${pct(spread.spread_pct)})`
                  : ""}
              </span>
            </div>
            <p className="note">
              Grailed relative to eBay. Negative means Grailed sells cheaper.
            </p>
          </>
        ) : (
          <p className="muted">
            This piece has only sold on one marketplace so far, so there is no
            spread to compare.
          </p>
        )}
      </div>

      {markdown ? (
        <div className="panel">
          <h2>Markdown behaviour</h2>
          <div className="kv">
            <span className="muted">Median markdown (ask &rarr; sold)</span>
            <span>{pct(markdown.median_markdown_pct)}</span>
          </div>
          <div className="kv">
            <span className="muted">P90 markdown</span>
            <span>{pct(markdown.p90_markdown_pct)}</span>
          </div>
          <div className="kv">
            <span className="muted">Sales with an ask</span>
            <span>{markdown.n_with_markdown}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
