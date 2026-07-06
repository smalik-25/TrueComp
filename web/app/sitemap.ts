import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Static routes only. Piece pages are intentionally left out: they key on
// canonical_key, which churns as the corpus re-resolves, so pinning them in a
// sitemap would list URLs that go stale.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/search", "/identify", "/method", "/underpriced", "/colophon"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
