from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "data" / "fixtures"

# maps each Grailed fixture file to the seed query that produced it
GRAILED_FILES = {
    "rick": ("grailed/grailed_fixtures_rick.json", "rick owens"),
    "undercover": ("grailed/grailed_fixtures_undercover.json", "undercover"),
    "raf_simons": ("grailed/grailed_fixtures_raf_simons.json", "raf simons"),
}


def _load(rel: str) -> list[dict]:
    return json.loads((FIXTURES / rel).read_text())


@pytest.fixture(scope="session")
def ebay_rows() -> list[dict]:
    return _load("ebay_fixtures.json")


@pytest.fixture(scope="session")
def grailed_rick() -> list[dict]:
    return _load(GRAILED_FILES["rick"][0])


@pytest.fixture(scope="session")
def grailed_undercover() -> list[dict]:
    return _load(GRAILED_FILES["undercover"][0])


@pytest.fixture(scope="session")
def grailed_all() -> dict[str, list[dict]]:
    return {name: _load(rel) for name, (rel, _q) in GRAILED_FILES.items()}
