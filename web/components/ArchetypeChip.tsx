import { Chip } from "./Chip";

// Archetype filter chip. The archetype names a kind of relic, so it reads in
// serif; the count stays mono.
export function ArchetypeChip({
  archetype,
  count,
  active,
}: {
  archetype: string;
  count?: number | string;
  active?: boolean;
}) {
  return <Chip label={archetype} count={count} active={active} variant="archetype" />;
}
