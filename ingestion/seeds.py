"""Seed queries and actor input templates for the live corpus pull.

The approved scope is ~30 archive/avant-garde menswear brands plus a few
archetype-broadening queries so the corpus is not footwear-only (DQ rule 6).
Grailed runs one searchQuery per brand (department-scoped to menswear); eBay
batches all keywords into a single run.
"""
from __future__ import annotations

from .grail_seeds import GRAIL_TARGETS

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
    return _ebay_inputs(all_queries(), max_items)


def _ebay_inputs(queries: list[str], max_items: int) -> list[dict]:
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


# --- grail-targeted pull (extension arc) --------------------------------------
# One search per grail target (brand plus canonical model name), capped per item.
# Menswear/unisex soldOnly on Grailed; the same queries batched on eBay. Driven by
# grail_seeds so it stays in step with the grail_targets table.

def grail_queries() -> list[str]:
    return [f"{t['brand_norm']} {t['canonical_name']}" for t in GRAIL_TARGETS]


def grail_grailed_inputs(max_items: int = 40) -> list[tuple[str, dict]]:
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
        for q in grail_queries()
    ]


def grail_ebay_inputs(max_items: int = 40) -> list[dict]:
    return _ebay_inputs(grail_queries(), max_items)


def grail_active_grailed_inputs(max_items: int = 40) -> list[tuple[str, dict]]:
    """Per-target Grailed runs for ACTIVE asks (soldOnly=False), the arbitrage
    detector's input. Same grail queries; the current ask is the listing price."""
    return [
        (
            q,
            {
                "searchQuery": q,
                "department": "menswear",
                "soldOnly": False,
                "scrapeDetails": False,
                "maxItems": max_items,
            },
        )
        for q in grail_queries()
    ]
