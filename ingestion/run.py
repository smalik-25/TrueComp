"""Ingestion entrypoint.

    python -m ingestion.run --source all --from-fixtures   # committed fixtures
    python -m ingestion.run --probe                        # 1 query, maxItems 5 (tiny spend)
    python -m ingestion.run --source all --live            # full approved pull (spends)

Runs the per-source adapters over either the committed fixtures or a live Apify
pull, and loads canonical rows into Neon. Live modes spend; fixtures do not.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from .adapters.ebay import EbayAdapter
from .adapters.grailed import GrailedAdapter
from .canonical import AdapterResult
from .db import connect
from .fx import DEFAULT_FX
from .loader import Loader

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "data" / "fixtures"

# Grailed fixture files mapped to the seed query that produced each.
GRAILED_FIXTURES = [
    ("grailed/grailed_fixtures_rick.json", "rick owens"),
    ("grailed/grailed_fixtures_undercover.json", "undercover"),
    ("grailed/grailed_fixtures_raf_simons.json", "raf simons"),
]
EBAY_FIXTURE = "ebay_fixtures.json"


def _load_json(rel: str) -> list[dict]:
    return json.loads((FIXTURES / rel).read_text())


def adapt_grailed() -> AdapterResult:
    adapter = GrailedAdapter(DEFAULT_FX)
    combined = AdapterResult()
    for rel, keyword in GRAILED_FIXTURES:
        res = adapter.adapt(_load_json(rel), query_keyword=keyword)
        combined.rows.extend(res.rows)
        combined.rejected.extend(res.rejected)
        combined.skipped += res.skipped
    return combined


def adapt_ebay() -> AdapterResult:
    return EbayAdapter(DEFAULT_FX).adapt(_load_json(EBAY_FIXTURE))


def _collect(args) -> dict[str, AdapterResult]:
    if args.from_fixtures:
        results: dict[str, AdapterResult] = {}
        if args.source in ("all", "grailed"):
            results["grailed"] = adapt_grailed()
        if args.source in ("all", "ebay"):
            results["ebay"] = adapt_ebay()
        return results

    if args.probe:
        from .live import pull_grailed

        print("[probe] one Grailed query, maxItems=5 (tiny spend to validate the client)")
        return {"grailed": pull_grailed(max_items=5, limit_queries=1)}

    # --live
    from .live import pull_all

    sources = ("grailed", "ebay") if args.source == "all" else (args.source,)
    return pull_all(max_items=args.max_items, sources=sources)


def main() -> int:
    parser = argparse.ArgumentParser(description="TrueComp ingestion")
    parser.add_argument("--source", choices=["all", "grailed", "ebay"], default="all")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--from-fixtures", action="store_true", help="load committed fixtures")
    mode.add_argument("--live", action="store_true", help="live Apify pull (spends)")
    mode.add_argument(
        "--probe", action="store_true", help="single small live query to validate the client"
    )
    parser.add_argument("--max-items", type=int, default=50, help="per-query cap for live pulls")
    args = parser.parse_args()

    results = _collect(args)

    for name, res in results.items():
        print(f"[adapter] {name}: {res.summary}")
        for rej in res.rejected[:20]:
            print(f"  reject {name} {rej.source_listing_id}: {rej.reason}")

    with connect() as conn:
        loader = Loader(conn, DEFAULT_FX)
        loader.seed_reference()
        for name, res in results.items():
            stats = loader.load(res.rows)
            print(f"[load] {name}: {stats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
