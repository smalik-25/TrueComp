import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPieceByKey, getStaticPieceKeys } from "@/lib/queries/pieces";
import { getVelocity, getSpread, getMarkdown, getSales } from "@/lib/queries/detail";
import { displayBrand } from "@/lib/format";
import { Container } from "@/components/Container";
import { PieceHeader } from "@/components/PieceHeader";
import { RecommendationBlock } from "@/components/RecommendationBlock";
import { ThinDataNotice } from "@/components/ThinDataNotice";
import { SectionRule } from "@/components/SectionRule";
import { PriceBands } from "@/components/PriceBands";
import { DistributionHistogram } from "@/components/charts/DistributionHistogram";
import { VelocityStat } from "@/components/VelocityStat";
import { MarkdownMagnitude } from "@/components/MarkdownMagnitude";
import { SpreadPanel } from "@/components/SpreadPanel";
import { CompTable } from "@/components/CompTable";

// Marts refresh on the ingestion cron cadence, not per request, so pages are
// statically generated and revalidated daily. This masks Neon cold starts.
export const revalidate = 86400;

// Prebuild the richest pieces plus every piece with a cross-marketplace spread;
// the long tail renders on demand (dynamicParams defaults to true).
export async function generateStaticParams() {
  const keys = await getStaticPieceKeys(40);
  return keys.map((key) => ({ key }));
}

// Keys carry spaces and pipes; the route param is decoded, but decode again
// defensively (idempotent for these keys since they contain no percent escapes).
function decodeKey(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

// generateMetadata and the page both look up the piece; cache() dedups the read
// within a single render so Neon is hit once.
const loadPiece = cache((key: string) => getPieceByKey(key));

export async function generateMetadata({ params }: { params: { key: string } }): Promise<Metadata> {
  const piece = await loadPiece(decodeKey(params.key));
  if (!piece) return { title: "Piece not found" };
  const name = `${displayBrand(piece.brand_norm)}${piece.model_name ? ` ${piece.model_name}` : ""}`;
  return { title: name };
}

export default async function PiecePage({ params }: { params: { key: string } }) {
  const piece = await loadPiece(decodeKey(params.key));
  if (!piece) notFound();

  const [velocity, spread, markdown, sales] = await Promise.all([
    getVelocity(piece.piece_id),
    getSpread(piece.piece_id),
    getMarkdown(piece.piece_id),
    getSales(piece.piece_id),
  ]);

  const points = sales.map((s) => ({
    price: Number(s.sold_price_usd),
    bestOffer: s.price_reliability === "best_offer",
  }));
  // Only the marketplaces this piece actually sold on, so the header does not
  // imply a source that carries no comps for it.
  const sources = Array.from(new Set(sales.map((s) => s.marketplace)));

  return (
    <Container>
      <article className="piece">
        <PieceHeader
          brand={piece.brand_norm}
          model={piece.model_name}
          archetype={piece.archetype}
          season={piece.season_code}
          nSold={piece.n_sold}
          nBestOffer={piece.n_best_offer}
          sources={sources}
        />

        <RecommendationBlock
          recommendedListPrice={piece.recommended_list_price}
          grade={piece.confidence_grade}
          nSold={piece.n_sold}
          basis={piece.recommended_basis}
        />

        {piece.recommended_basis === "brand_archetype_fallback" ? <ThinDataNotice /> : null}

        <SectionRule label="Price band" />
        <PriceBands
          medianUsd={piece.median_usd}
          medianUsdReliable={piece.median_usd_reliable}
          sales={sales}
          nBestOffer={piece.n_best_offer}
        />

        <SectionRule label="Distribution" />
        {points.length > 0 ? (
          <DistributionHistogram points={points} />
        ) : (
          <p className="section-note">No individual sold prices to plot for this piece.</p>
        )}

        <SectionRule label="Velocity" />
        <VelocityStat velocity={velocity} />

        <SectionRule label="Markdown" />
        <MarkdownMagnitude markdown={markdown} />

        <SectionRule label="Cross-marketplace spread" />
        <SpreadPanel spread={spread} />

        <SectionRule label="The comps" />
        <CompTable sales={sales} />
      </article>
    </Container>
  );
}
