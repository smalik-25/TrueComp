import { Chip } from "./Chip";

// Season filter chip. A season code is pure data, so it reads entirely in mono.
// season_code is often null in the marts, so this filter is sparse and the rail
// hides it when empty (handled at the search page in a later phase).
export function SeasonChip({
  season,
  count,
  active,
  onClick,
}: {
  season: string;
  count?: number | string;
  active?: boolean;
  onClick?: () => void;
}) {
  return <Chip label={season} count={count} active={active} variant="season" onClick={onClick} />;
}
