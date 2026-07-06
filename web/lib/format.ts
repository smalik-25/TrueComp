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

// brand_norm is the normalized dedup token (lowercased, punctuation collapsed),
// not a display name. Title-casing it mangles exactly the names this audience
// knows, so map the corpus's brands to their real spelling: the cedilla in Comme
// des Garcons, the accents in Enfants Riches Deprimes, the parenthetical in
// Number (N)ine, the stylized 1017 ALYX 9SM. model_name already carries real
// casing (GAT, Geobasket) and is shown verbatim, so it is not mapped here.
// Unmapped brands fall back to a title-case so a new brand still reads legibly.
const BRAND_DISPLAY: Record<string, string> = {
  "rick owens": "Rick Owens",
  "raf simons": "Raf Simons",
  julius: "Julius",
  "number n ine": "Number (N)ine",
  "maison margiela": "Maison Margiela",
  undercover: "Undercover",
  "yohji yamamoto": "Yohji Yamamoto",
  visvim: "Visvim",
  "craig green": "Craig Green",
  vetements: "Vetements",
  "comme des garcons": "Comme des Garçons",
  "ann demeulemeester": "Ann Demeulemeester",
  "carol christian poell": "Carol Christian Poell",
  "helmut lang": "Helmut Lang",
  "acne studios": "Acne Studios",
  "kiko kostadinov": "Kiko Kostadinov",
  "wales bonner": "Wales Bonner",
  "white mountaineering": "White Mountaineering",
  "enfants riches deprimes": "Enfants Riches Déprimés",
  "boris bidjan saberi": "Boris Bidjan Saberi",
  "stone island": "Stone Island",
  "our legacy": "Our Legacy",
  "bottega veneta": "Bottega Veneta",
  neighborhood: "Neighborhood",
  needles: "Needles",
  kapital: "Kapital",
  "issey miyake": "Issey Miyake",
  "c p company": "C.P. Company",
  "1017 alyx 9sm": "1017 ALYX 9SM",
  supreme: "Supreme",
  guidi: "Guidi",
  "off white": "Off-White",
  salomon: "Salomon",
  // grail-set brands arriving with the corpus expansion
  "saint laurent": "Saint Laurent",
  dior: "Dior",
  "dior homme": "Dior Homme",
  balenciaga: "Balenciaga",
  "mihara yasuhiro": "Mihara Yasuhiro",
};

function titleCaseBrand(brand: string): string {
  return brand
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function displayBrand(brand: string): string {
  return BRAND_DISPLAY[brand] ?? titleCaseBrand(brand);
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
