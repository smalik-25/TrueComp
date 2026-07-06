"use client";

import { useMemo, useState } from "react";
import type { PieceComp } from "@/lib/queries/pieces";
import { displayBrand, formatInt } from "@/lib/format";
import { SearchInput } from "./SearchInput";
import { SortControl, type SortValue } from "./SortControl";
import { FilterRail, type Facet } from "./FilterRail";
import { PieceCard } from "./PieceCard";
import { EmptyState } from "./EmptyState";

const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

// The whole corpus is ~410 pieces, so it is fetched once on the server and
// filtered client-side for instant feedback. The query echoes in mono; the
// result count is mono; empty results are a first-class state.
export function SearchBrowse({ pieces }: { pieces: PieceComp[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("comps");
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [archetypes, setArchetypes] = useState<Set<string>>(new Set());
  const [seasons, setSeasons] = useState<Set<string>>(new Set());

  const facets = useMemo(() => {
    const b = new Map<string, number>();
    const a = new Map<string, number>();
    const s = new Map<string, number>();
    for (const p of pieces) {
      b.set(p.brand_norm, (b.get(p.brand_norm) ?? 0) + 1);
      if (p.archetype) a.set(p.archetype, (a.get(p.archetype) ?? 0) + 1);
      if (p.season_code) s.set(p.season_code, (s.get(p.season_code) ?? 0) + 1);
    }
    const toFacets = (m: Map<string, number>): Facet[] =>
      [...m.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count);
    return {
      brands: toFacets(b),
      archetypes: toFacets(a),
      seasons: toFacets(s).slice(0, 12), // sparse; show the most-populated only
    };
  }, [pieces]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pieces.filter((p) => {
      if (brands.size && !brands.has(p.brand_norm)) return false;
      if (archetypes.size && !(p.archetype && archetypes.has(p.archetype))) return false;
      if (seasons.size && !(p.season_code && seasons.has(p.season_code))) return false;
      if (q) {
        const hay = `${p.brand_norm} ${p.model_name ?? ""} ${p.archetype ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((x, y) => {
      switch (sort) {
        case "median-desc":
          return Number(y.median_usd) - Number(x.median_usd);
        case "median-asc":
          return Number(x.median_usd) - Number(y.median_usd);
        case "confidence":
          return (
            GRADE_ORDER[x.confidence_grade] - GRADE_ORDER[y.confidence_grade] ||
            y.n_sold - x.n_sold
          );
        case "comps":
        default:
          return y.n_sold - x.n_sold;
      }
    });
    return sorted;
  }, [pieces, query, sort, brands, archetypes, seasons]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, name: string) => {
    const next = new Set(set);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setter(next);
  };

  const anyActive = brands.size > 0 || archetypes.size > 0 || seasons.size > 0;
  const clear = () => {
    setBrands(new Set());
    setArchetypes(new Set());
    setSeasons(new Set());
  };

  return (
    <div className="search-page">
      <div className="search-top">
        <SearchInput value={query} onChange={setQuery} placeholder="Rick Owens, GAT, leather jacket" />
        <div className="search-meta">
          <span className="mono">{formatInt(results.length)} pieces</span>
          {query ? <span className="mono ink-3">for &ldquo;{query}&rdquo;</span> : null}
          <SortControl value={sort} onChange={setSort} />
        </div>
      </div>

      <div className="search-body">
        <FilterRail
          brands={facets.brands}
          archetypes={facets.archetypes}
          seasons={facets.seasons}
          activeBrands={brands}
          activeArchetypes={archetypes}
          activeSeasons={seasons}
          onToggleBrand={(n) => toggle(brands, setBrands, n)}
          onToggleArchetype={(n) => toggle(archetypes, setArchetypes, n)}
          onToggleSeason={(n) => toggle(seasons, setSeasons, n)}
          onClear={clear}
          anyActive={anyActive}
        />

        {results.length > 0 ? (
          <div className="piece-grid">
            {results.map((p) => (
              <PieceCard
                key={p.canonical_key}
                canonicalKey={p.canonical_key}
                brand={displayBrand(p.brand_norm)}
                archetype={p.archetype}
                model={p.model_name}
                season={p.season_code}
                medianUsd={p.median_usd}
                nSold={p.n_sold}
                grade={p.confidence_grade}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pieces match"
            body="Loosen a filter or try a different brand or model. Archive pieces are sparse by nature."
          />
        )}
      </div>
    </div>
  );
}
