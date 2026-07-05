"""Seed queries and actor input templates for the live corpus pull.

The approved scope is ~30 archive/avant-garde menswear brands plus a few
archetype-broadening queries so the corpus is not footwear-only (DQ rule 6).
Grailed runs one searchQuery per brand (department-scoped to menswear); eBay
batches all keywords into a single run.
"""
from __future__ import annotations

# 30 approved brands, in the form used as a search query / keyword.
BRANDS: list[str] = [
    "rick owens",
    "maison margiela",
    "raf simons",
    "undercover",
    "number (n)ine",
    "comme des garcons",
    "yohji yamamoto",
    "helmut lang",
    "carol christian poell",
    "boris bidjan saberi",
    "enfants riches deprimes",
    "1017 alyx",
    "acne studios",
    "ann demeulemeester",
    "bottega veneta",
    "cp company",
    "craig green",
    "guidi",
    "issey miyake",
    "julius",
    "kapital",
    "kiko kostadinov",
    "our legacy",
    "stone island",
    "vetements",
    "visvim",
    "wales bonner",
    "white mountaineering",
    "needles",
    "neighborhood",
]

# archetype-broadening queries on high-signal brands, to de-bias from footwear.
ARCHETYPE_QUERIES: list[str] = [
    "rick owens jacket",
    "raf simons knit",
    "maison margiela denim",
    "undercover jacket",
    "yohji yamamoto coat",
    "comme des garcons knit",
]


def all_queries() -> list[str]:
    return BRANDS + ARCHETYPE_QUERIES


def grailed_inputs(max_items: int = 50) -> list[tuple[str, dict]]:
    """(query_keyword, actor_input) per Grailed run."""
    return [
        (
            q,
            {
                "searchQuery": q,
                "department": "menswear",
                "soldOnly": True,
                "scrapeDetails": False,
                "maxItems": max_items,
            },
        )
        for q in all_queries()
    ]


# the eBay actor caps keywords at 6 per run
EBAY_KEYWORDS_PER_RUN = 6


def ebay_inputs(max_items: int = 50) -> list[dict]:
    """Chunked eBay runs (<=6 keywords each), matching the proven actor input
    (categoryId 11450 = Clothing/Shoes/Accessories, ended-recently sort)."""
    queries = all_queries()
    n = EBAY_KEYWORDS_PER_RUN
    chunks = [queries[i:i + n] for i in range(0, len(queries), n)]
    return [
        {
            "categoryId": "11450",
            "subcategoryId": "",
            "keywords": chunk,
            "count": max_items,
            "daysToScrape": 90,
            "ebaySite": "ebay.com",
            "sortOrder": "endedRecently",
            "itemLocation": "default",
            "itemCondition": "any",
        }
        for chunk in chunks
    ]
