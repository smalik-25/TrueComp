// Formatting helpers for the mono voice. Marts hand numeric columns back as
// strings (pg numeric), so every helper accepts string | number and coerces
// once, here, at the render boundary.

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Whole-dollar USD by default (archive prices are large; cents are noise).
export function formatUsd(
  value: string | number | null | undefined,
  opts: { cents?: boolean } = {},
): string {
  const n = toNumber(value);
  if (n === null) return "n/a";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

// Signed percentage, e.g. "+73%" or "-46%". A spread reads as a direction.
export function formatPct(
  value: string | number | null | undefined,
  opts: { sign?: boolean; digits?: number } = {},
): string {
  const n = toNumber(value);
  if (n === null) return "n/a";
  const digits = opts.digits ?? 0;
  const body = `${Math.abs(n).toFixed(digits)}%`;
  if (!opts.sign) return `${n < 0 ? "-" : ""}${body}`;
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${body}`;
}

export function formatInt(value: string | number | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return "n/a";
  return Math.round(n).toLocaleString("en-US");
}

// A count with a mono-friendly unit, e.g. "12 comps".
export function formatCount(
  value: string | number | null | undefined,
  unit: string,
): string {
  const n = toNumber(value);
  if (n === null) return "n/a";
  const rounded = Math.round(n);
  return `${rounded.toLocaleString("en-US")} ${unit}${rounded === 1 ? "" : "s"}`;
}

// brand_norm is the normalized dedup token (lowercased), not a display name, so
// it is title-cased for the serif. model_name already carries real casing (GAT,
// Geobasket) and must be shown verbatim. A proper display-name mapping is a data
// task; this is the honest read-layer default. Normalization artifacts such as
// "number n ine" surface as-is rather than being silently rewritten.
export function displayBrand(brand: string): string {
  return brand
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// A ratio column (markdown, spread) rendered as a signed percent.
export function formatRatioPct(
  ratio: string | number | null | undefined,
  opts: { sign?: boolean } = {},
): string {
  const n = toNumber(ratio);
  if (n === null) return "n/a";
  return formatPct(n * 100, { sign: opts.sign, digits: 0 });
}
