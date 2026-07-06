"""The grail reference set: the ~18 stable, recognizable models the corpus
expansion, resolution taxonomy, and visual search all key on.

Encoded from the grail reference report. brand_norm matches the resolver's
normalized brand form (Dior Homme normalizes to "dior", Number (N)ine to
"number n ine"). alt_names feed entity resolution; visual_distinctiveness and
replica_hazard set expectations for retrieval and flag the heavily-faked classes
the report says to gate behind a higher confidence threshold.
"""
from __future__ import annotations

GRAIL_TARGETS: list[dict] = [
    {
        "brand_norm": "rick owens", "canonical_name": "Ramones", "archetype": "footwear",
        "alt_names": ["ramone", "sneaks", "rick ramones", "drkshdw ramones"],
        "visual_distinctiveness": "high", "replica_hazard": True,
        "notes": "highest-volume Rick footwear; canvas DRKSHDW version common and faked",
    },
    {
        "brand_norm": "rick owens", "canonical_name": "Geobasket", "archetype": "footwear",
        "alt_names": ["geo", "geobaskets", "geobasket hi"],
        "visual_distinctiveness": "high", "replica_hazard": False,
        "notes": "most photographed Rick sneaker; confusable with Dunk and Geth",
    },
    {
        "brand_norm": "rick owens", "canonical_name": "Pods", "archetype": "pants",
        "alt_names": ["pod cargo", "creatch cargo pods", "cargo pods"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "drop-rise cargo short/pant; high volume within RO bottoms",
    },
    {
        "brand_norm": "balenciaga", "canonical_name": "Triple S", "archetype": "footwear",
        "alt_names": ["triples", "triple s trainer"],
        "visual_distinctiveness": "high", "replica_hazard": True,
        "notes": "most-faked luxury sneaker; key on the stacked sole tooling",
    },
    {
        "brand_norm": "balenciaga", "canonical_name": "Track", "archetype": "footwear",
        "alt_names": ["track 2", "track 3", "track trainer"],
        "visual_distinctiveness": "high", "replica_hazard": False,
        "notes": "Track 3 the most popular current version",
    },
    {
        "brand_norm": "balenciaga", "canonical_name": "Speed", "archetype": "footwear",
        "alt_names": ["speed trainer", "speed sock", "speed 2.0"],
        "visual_distinctiveness": "med", "replica_hazard": True,
        "notes": "sock silhouette; high cross-brand ambiguity, key on the pull tab",
    },
    {
        "brand_norm": "balenciaga", "canonical_name": "Political Campaign", "archetype": "top",
        "alt_names": ["campaign logo"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "embroidered campaign-logo hoodie/tee; most reliable Balenciaga apparel",
    },
    {
        "brand_norm": "maison margiela", "canonical_name": "Tabi", "archetype": "footwear",
        "alt_names": ["tabis", "split toe", "cloven", "tabi boots"],
        "visual_distinctiveness": "high", "replica_hazard": True,
        "notes": "split-toe boot; near-unique silhouette, resolve sub-type vs flats",
    },
    {
        "brand_norm": "maison margiela", "canonical_name": "GAT", "archetype": "footwear",
        "alt_names": [
            "gats", "german army trainer", "replica sneaker", "replica gat", "22 replica",
        ],
        "visual_distinctiveness": "high", "replica_hazard": True,
        "notes": "the brand's most popular silhouette; key on painted heel tab + Replica label",
    },
    {
        "brand_norm": "maison margiela", "canonical_name": "Future", "archetype": "footwear",
        "alt_names": ["futures", "trashed future", "22 future"],
        "visual_distinctiveness": "high", "replica_hazard": False,
        "notes": "high-top popularized on the Yeezus tour",
    },
    {
        "brand_norm": "saint laurent", "canonical_name": "Teddy", "archetype": "outerwear",
        "alt_names": ["teddy jacket", "teddy varsity"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "wool/leather varsity; ambiguous vs generic varsity jackets",
    },
    {
        "brand_norm": "saint laurent", "canonical_name": "L01", "archetype": "outerwear",
        "alt_names": ["l 01", "l-01", "perfecto"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "cropped leather moto; the Hedi uniform, ambiguous vs other bikers",
    },
    {
        "brand_norm": "saint laurent", "canonical_name": "Wyatt", "archetype": "footwear",
        "alt_names": ["wyatt harness", "wyatt chelsea", "wyatt jodhpur"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "Cuban-heel harness/Chelsea boot; the signature Hedi SLP footwear",
    },
    {
        "brand_norm": "dior", "canonical_name": "Luster", "archetype": "denim",
        "alt_names": ["lustre", "waxed denim", "clawmark denim", "19cm"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "AW03 waxed skinny; reissued 2007; single most-searched Dior Homme object",
    },
    {
        "brand_norm": "dior", "canonical_name": "Navigate", "archetype": "footwear",
        "alt_names": ["dior navigate"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "AW07 lace-up military boot; false-positive risk vs Dr. Martens",
    },
    {
        "brand_norm": "vetements", "canonical_name": "DHL", "archetype": "top",
        "alt_names": ["dhl tee", "dhl logo tee"],
        "visual_distinctiveness": "high", "replica_hazard": True,
        "notes": "the yellow DHL-logo tee; instantly identifiable but massively bootlegged",
    },
    {
        "brand_norm": "vetements", "canonical_name": "Logo Hoodie", "archetype": "top",
        "alt_names": ["staff hoodie", "antwerpen hoodie", "world tour hoodie"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "oversized slogan hoodie; the specific graphic is the resolving key",
    },
    {
        "brand_norm": "number n ine", "canonical_name": "Give Peace a Chance", "archetype": "denim",
        "alt_names": ["gpac", "patch denim", "patch jeans"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "AW04 five-patch thigh denim; season-grail, grade auto-ID lower",
    },
    {
        "brand_norm": "undercover", "canonical_name": "Nike Collab", "archetype": "footwear",
        "alt_names": ["daybreak", "overbreak", "dunk high undercover", "react element 87"],
        "visual_distinctiveness": "med", "replica_hazard": False,
        "notes": "stable sneaker silhouettes; the most retrieval-friendly Undercover entities",
    },
    {
        "brand_norm": "undercover", "canonical_name": "Scab", "archetype": "top",
        "alt_names": ["scab pants", "scab backpack"],
        "visual_distinctiveness": "low", "replica_hazard": False,
        "notes": "SS03 collection tag, not a single model; near one-of-a-kind, low auto-ID",
    },
]
