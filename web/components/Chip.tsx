// Base filter chip. Brand, Archetype, and Season wrap it so each obeys the
// serif/mono rule internally (see the variant files). Presentational in Phase 1;
// the count is mono, the toggle state is exposed via aria-pressed. Interactive
// filtering wiring lands with the search page.
export function Chip({
  label,
  count,
  active = false,
  variant,
}: {
  label: React.ReactNode;
  count?: number | string;
  active?: boolean;
  variant?: "brand" | "archetype" | "season";
}) {
  return (
    <button
      type="button"
      className={`chip ${variant ? `chip--${variant}` : ""}`}
      data-active={active}
      aria-pressed={active}
    >
      <span>{label}</span>
      {count !== undefined ? <span className="chip-count">{count}</span> : null}
    </button>
  );
}
