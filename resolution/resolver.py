"""Text-first entity resolution.

Staged and deterministic: normalized brand match, then archetype and model-token
matching, then season code. A piece is only formed when the brand plus at least
an archetype or a model is known; a brand-only row is left unresolved rather than
collapsed into a bogus mega-piece (that would be the "forcing bad joins" failure
the plan warns against). No image embeddings; title embeddings are a later,
gated option if the residual unmatched set justifies them.
"""
from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz

from ingestion.normalize import norm_brand

from . import taxonomy

_FUZZY_BRAND_THRESHOLD = 92


@dataclass(frozen=True)
class Resolution:
    brand_display: str | None
    brand_norm: str | None
    archetype: str | None
    model_name: str | None
    season_code: str | None
    confidence: str          # high | medium | brand_only | unresolved
    canonical_key: str | None

    @property
    def matched(self) -> bool:
        # only high/medium get a piece_id; brand_only and unresolved stay null
        return self.confidence in ("high", "medium")


def _norm(text: str | None) -> str:
    return norm_brand(text) or ""


def _alias_hit(source: str, words: set[str], alias: str) -> bool:
    # multi-word aliases match as substrings; single tokens must match a whole
    # word, so short aliases (roa, lv, cdg) do not fire inside longer words
    if " " in alias:
        return alias in source
    return alias in words


def match_brand(title_norm: str, keyword_norm: str) -> str | None:
    # word-aware match over the title first, then the seed keyword
    for source in (title_norm, keyword_norm):
        words = set(source.split())
        for brand, aliases in taxonomy.BRAND_ALIASES.items():
            if any(_alias_hit(source, words, alias) for alias in aliases):
                return brand
    # fuzzy fallback for misspellings; only distinctive (>=6 char) aliases, so
    # short brand codes cannot spuriously clear the threshold
    best_brand, best_score = None, 0
    for brand, aliases in taxonomy.BRAND_ALIASES.items():
        for alias in aliases:
            if len(alias) < 6:
                continue
            score = fuzz.partial_ratio(alias, title_norm)
            if score > best_score:
                best_brand, best_score = brand, score
    return best_brand if best_score >= _FUZZY_BRAND_THRESHOLD else None


def _match_tokens(text_norm: str, words: set[str], tokens: list[str]) -> bool:
    for tok in tokens:
        if " " in tok:
            if tok in text_norm:
                return True
        elif tok in words:
            return True
    return False


def match_archetype(text_norm: str, words: set[str]) -> str | None:
    for archetype, tokens in taxonomy.ARCHETYPE_TOKENS:
        if _match_tokens(text_norm, words, tokens):
            return archetype
    return None


def match_model(brand: str, text_norm: str, words: set[str]) -> str | None:
    for model, tokens in taxonomy.BRAND_MODELS.get(brand, {}).items():
        if _match_tokens(text_norm, words, tokens):
            return model
    return None


def resolve(raw_title: str | None, query_keyword: str | None) -> Resolution:
    title_norm = _norm(raw_title)
    keyword_norm = _norm(query_keyword)
    text_norm = f"{title_norm} {keyword_norm}".strip()
    words = set(text_norm.split())

    brand = match_brand(title_norm, keyword_norm)
    if brand is None:
        return Resolution(None, None, None, None, None, "unresolved", None)

    archetype = match_archetype(text_norm, words)
    model = match_model(brand, text_norm, words)
    if model and not archetype:
        archetype = taxonomy.MODEL_ARCHETYPE.get(model)
    season = taxonomy.season_code(raw_title)

    brand_norm = norm_brand(brand)
    if model:
        confidence = "high"
    elif archetype:
        confidence = "medium"
    else:
        confidence = "brand_only"

    canonical_key = None
    if confidence in ("high", "medium"):
        model_key = (norm_brand(model) or "") if model else ""
        season_key = (season or "").lower()  # keep the whole key uniformly lowercase
        canonical_key = f"{brand_norm}|{archetype or ''}|{model_key}|{season_key}"

    return Resolution(
        brand_display=brand,
        brand_norm=brand_norm,
        archetype=archetype,
        model_name=model,
        season_code=season,
        confidence=confidence,
        canonical_key=canonical_key,
    )
