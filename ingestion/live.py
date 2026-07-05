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
from .apify import run_actor
from .canonical import AdapterResult
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


def pull_grailed(max_items: int = 50, limit_queries: int | None = None) -> AdapterResult:
    actor = _actor("APIFY_ACTOR_GRAILED")
    adapter = GrailedAdapter(DEFAULT_FX)
    combined = AdapterResult()
    raw_all: list[dict] = []
    inputs = seeds.grailed_inputs(max_items)
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


def pull_ebay(max_items: int = 50) -> AdapterResult:
    actor = _actor("APIFY_ACTOR_EBAY")
    adapter = EbayAdapter(DEFAULT_FX)
    combined = AdapterResult()
    raw_all: list[dict] = []
    for i, run_input in enumerate(seeds.ebay_inputs(max_items), 1):
        rows = run_actor(actor, run_input)
        raw_all.extend(rows)
        res = adapter.adapt(rows)
        combined.rows.extend(res.rows)
        combined.rejected.extend(res.rejected)
        combined.skipped += res.skipped
        print(f"[ebay] chunk {i} {run_input['keywords']}: pulled {len(rows)} -> {res.summary}")
    _save_raw("ebay", raw_all)
    return combined


def pull_all(
    max_items: int = 50, sources: tuple[str, ...] = ("grailed", "ebay")
) -> dict[str, AdapterResult]:
    out: dict[str, AdapterResult] = {}
    if "grailed" in sources:
        out["grailed"] = pull_grailed(max_items)
    if "ebay" in sources:
        out["ebay"] = pull_ebay(max_items)
    return out
