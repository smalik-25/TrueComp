"""Live corpus pull: run the pinned Apify actors, save raw JSON, adapt.

Raw pulls land in data/raw/ (gitignored) so nothing bloats the repo, and are
loaded to Neon immediately (free-tier Apify datasets expire in 7 days). Adapters
and the loader are reused unchanged; overlapping brand/keyword hits dedup on the
natural key at load.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from . import seeds
from .adapters.ebay import EbayAdapter
from .adapters.grailed import GrailedAdapter
from .adapters.grailed_active import GrailedActiveAdapter
from .apify import run_actor
from .canonical import ActiveResult, AdapterResult
from .fx import DEFAULT_FX

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"


def _save_raw(source: str, rows: list[dict]) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = RAW / f"{source}_{stamp}.json"
    path.write_text(json.dumps(rows))
    print(f"[raw] {source}: wrote {len(rows)} rows -> {path.relative_to(ROOT)}")


def _actor(env_key: str) -> str:
    load_dotenv(ROOT / ".env")
    slug = os.environ.get(env_key)
    if not slug:
        raise RuntimeError(f"{env_key} is not set (check .env)")
    return slug


def pull_grailed(
    max_items: int = 50, limit_queries: int | None = None, grail: bool = False
) -> AdapterResult:
    actor = _actor("APIFY_ACTOR_GRAILED")
    adapter = GrailedAdapter(DEFAULT_FX)
    combined = AdapterResult()
    raw_all: list[dict] = []
    inputs = seeds.grail_grailed_inputs(max_items) if grail else seeds.grailed_inputs(max_items)
    if limit_queries is not None:
        inputs = inputs[:limit_queries]
    for keyword, run_input in inputs:
        rows = run_actor(actor, run_input)
        raw_all.extend(rows)
        res = adapter.adapt(rows, query_keyword=keyword)
        combined.rows.extend(res.rows)
        combined.rejected.extend(res.rejected)
        combined.skipped += res.skipped
        print(f"[grailed] {keyword!r}: pulled {len(rows)} -> {res.summary}")
    _save_raw("grailed", raw_all)
    return combined


def pull_ebay(max_items: int = 50, grail: bool = False) -> AdapterResult:
    actor = _actor("APIFY_ACTOR_EBAY")
    adapter = EbayAdapter(DEFAULT_FX)
    combined = AdapterResult()
    raw_all: list[dict] = []
    ebay_inputs = seeds.grail_ebay_inputs(max_items) if grail else seeds.ebay_inputs(max_items)
    for i, run_input in enumerate(ebay_inputs, 1):
        rows = run_actor(actor, run_input)
        raw_all.extend(rows)
        res = adapter.adapt(rows)
        combined.rows.extend(res.rows)
        combined.rejected.extend(res.rejected)
        combined.skipped += res.skipped
        print(f"[ebay] chunk {i} {run_input['keywords']}: pulled {len(rows)} -> {res.summary}")
    _save_raw("ebay", raw_all)
    return combined


def pull_active_grailed(max_items: int = 40) -> ActiveResult:
    """Grail-targeted active asks from Grailed (soldOnly=False). Grailed only for
    now: the pinned eBay actor is sold-only, so eBay active needs its own actor."""
    actor = _actor("APIFY_ACTOR_GRAILED")
    adapter = GrailedActiveAdapter(DEFAULT_FX)
    combined = ActiveResult()
    raw_all: list[dict] = []
    for keyword, run_input in seeds.grail_active_grailed_inputs(max_items):
        rows = run_actor(actor, run_input)
        raw_all.extend(rows)
        res = adapter.adapt(rows, query_keyword=keyword)
        combined.rows.extend(res.rows)
        combined.rejected.extend(res.rejected)
        combined.skipped += res.skipped
        print(f"[grailed-active] {keyword!r}: pulled {len(rows)} -> {res.summary}")
    _save_raw("grailed_active", raw_all)
    return combined


def pull_all(
    max_items: int = 50,
    sources: tuple[str, ...] = ("grailed", "ebay"),
    grail: bool = False,
) -> dict[str, AdapterResult]:
    out: dict[str, AdapterResult] = {}
    if "grailed" in sources:
        out["grailed"] = pull_grailed(max_items, grail=grail)
    if "ebay" in sources:
        out["ebay"] = pull_ebay(max_items, grail=grail)
    return out
