import { Chip } from "./Chip";

// Brand filter chip. The brand name is sans (functional filter), the count mono.
export function BrandChip({
  brand,
  count,
  active,
  onClick,
}: {
  brand: string;
  count?: number | string;
  active?: boolean;
  onClick?: () => void;
}) {
  return <Chip label={brand} count={count} active={active} variant="brand" onClick={onClick} />;
}
