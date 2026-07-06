"""Pure resolution metrics, kept free of DB and IO so they stay easy to test.

The extension plan asks for two honest numbers on the grail set: the model-level
resolution rate (of the sold rows that resolve to a grail brand, how many reach a
model rather than stopping at brand plus archetype), and how many grail pieces are
resolved on more than one marketplace. The pure counting lives here; resolution.run
does the database IO and prints the report in the same stdout style as ml.train.
"""
from __future__ import annotations

from collections import defaultdict

# Grail-set brands in brand_norm form (the eight the reference report covers).
# Hardcoded until grail_targets lands and can drive it; Dior Homme normalizes to
# "dior", so the mainline and Homme sit under one brand key here.
GRAIL_BRANDS: frozenset[str] = frozenset(
    {
        "rick owens",
        "balenciaga",
        "maison margiela",
        "saint laurent",
        "dior",
        "vetements",
        "number n ine",
        "undercover",
    }
)


def model_resolution_rate(
    rows: list[tuple[str | None, str | None]],
    grail_brands: frozenset[str] = GRAIL_BRANDS,
) -> dict[str, tuple[int, int]]:
    """Per grail brand, (rows resolved to a model, rows resolved to the brand).

    `rows` is (brand_norm, model_name) for every resolved sold row. Brands with no
    rows are omitted; the caller turns the two counts into a rate.
    """
    resolved: dict[str, int] = defaultdict(int)
    with_model: dict[str, int] = defaultdict(int)
    for brand_norm, model_name in rows:
        if brand_norm not in grail_brands:
            continue
        resolved[brand_norm] += 1
        if model_name:
            with_model[brand_norm] += 1
    return {b: (with_model[b], resolved[b]) for b in sorted(resolved)}


def overall_rate(per_brand: dict[str, tuple[int, int]]) -> tuple[int, int]:
    """Collapse the per-brand (model, total) counts into one (model, total) pair."""
    model = sum(m for m, _t in per_brand.values())
    total = sum(t for _m, t in per_brand.values())
    return model, total
