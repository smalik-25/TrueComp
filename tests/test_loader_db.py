"""Loader integration test against the real database.

Opt-in: runs only when TRUECOMP_DB_TESTS=1 (and DATABASE_URL is set). This keeps
the default suite fast, offline, and deterministic; the CI job and a plain
`make test` skip it, while `TRUECOMP_DB_TESTS=1 pytest` exercises Neon.
"""
from __future__ import annotations

import os

import pytest
from dotenv import load_dotenv

from ingestion.db import ROOT, connect
from ingestion.loader import Loader
from ingestion.run import adapt_ebay

load_dotenv(ROOT / ".env")

pytestmark = pytest.mark.skipif(
    os.environ.get("TRUECOMP_DB_TESTS") != "1" or not os.environ.get("DATABASE_URL"),
    reason="set TRUECOMP_DB_TESTS=1 (with DATABASE_URL) to run database integration tests",
)


def _fact_count(conn) -> int:
    with conn.cursor() as cur:
        cur.execute("select count(*) from fact_sold_listing")
        return cur.fetchone()[0]


def test_load_is_idempotent():
    rows = adapt_ebay().rows
    with connect() as conn:
        loader = Loader(conn)
        loader.seed_reference()

        loader.load(rows)              # ensure present (insert or skip)
        before = _fact_count(conn)

        stats = loader.load(rows)      # second load must be a no-op
        after = _fact_count(conn)

    assert stats.inserted == 0
    assert stats.skipped_conflict == len(rows)
    assert after == before
