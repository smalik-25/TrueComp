"use client";

import { BrandChip } from "./BrandChip";
import { ArchetypeChip } from "./ArchetypeChip";
import { SeasonChip } from "./SeasonChip";
import { displayBrand } from "@/lib/format";

export type Facet = { name: string; count: number };

// The left filter rail. Group labels are mono (technical controls); brand and
// archetype chips read in serif (relic names), season chips in mono (codes).
// Season is sparse (most pieces carry no season), so it hides when empty.
export function FilterRail({
  brands,
  archetypes,
  seasons,
  activeBrands,
  activeArchetypes,
  activeSeasons,
  onToggleBrand,
  onToggleArchetype,
  onToggleSeason,
  onClear,
  anyActive,
}: {
  brands: Facet[];
  archetypes: Facet[];
  seasons: Facet[];
  activeBrands: Set<string>;
  activeArchetypes: Set<string>;
  activeSeasons: Set<string>;
  onToggleBrand: (name: string) => void;
  onToggleArchetype: (name: string) => void;
  onToggleSeason: (name: string) => void;
  onClear: () => void;
  anyActive: boolean;
}) {
  return (
    <aside className="filter-rail" aria-label="Filters">
      <div className="filter-rail-head">
        <span className="sort-label">Filter</span>
        {anyActive ? (
          <button type="button" className="filter-clear" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="filter-group">
        <span className="filter-group-label">Brand</span>
        <div className="filter-chips filter-chips--scroll">
          {brands.map((b) => (
            <BrandChip
              key={b.name}
              brand={displayBrand(b.name)}
              count={b.count}
              active={activeBrands.has(b.name)}
              onClick={() => onToggleBrand(b.name)}
            />
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group-label">Archetype</span>
        <div className="filter-chips">
          {archetypes.map((a) => (
            <ArchetypeChip
              key={a.name}
              archetype={a.name}
              count={a.count}
              active={activeArchetypes.has(a.name)}
              onClick={() => onToggleArchetype(a.name)}
            />
          ))}
        </div>
      </div>

      {seasons.length > 0 ? (
        <div className="filter-group">
          <span className="filter-group-label">Season</span>
          <div className="filter-chips filter-chips--scroll">
            {seasons.map((s) => (
              <SeasonChip
                key={s.name}
                season={s.name}
                count={s.count}
                active={activeSeasons.has(s.name)}
                onClick={() => onToggleSeason(s.name)}
              />
            ))}
          </div>
          <p className="t-caption ink-faint">Most pieces carry no season code, so this filter is sparse.</p>
        </div>
      ) : null}
    </aside>
  );
}
