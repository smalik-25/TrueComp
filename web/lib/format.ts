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
