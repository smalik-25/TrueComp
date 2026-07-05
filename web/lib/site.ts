// The canonical site origin for absolute metadata URLs (Open Graph, canonical,
// sitemap). Set NEXT_PUBLIC_SITE_URL on deploy; Vercel's VERCEL_URL is the
// automatic fallback; localhost is the last resort for local runs. Without this,
// a deploy would silently emit localhost URLs to scrapers and search engines.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
