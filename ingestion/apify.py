"""Minimal Apify API client.

Triggers a pinned actor and returns its dataset items. Uses the synchronous
run-and-get-items endpoint, which is the simplest reliable pattern for the small,
maxItems-capped runs this pipeline does. A failed, timed-out, or empty run returns
an empty list rather than raising, so one bad query never sinks the whole pull
(anticipated problem #9). The actor slug is given as `username/actor`; the API
wants `username~actor`.
"""
from __future__ import annotations

import os
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
_BASE = "https://api.apify.com/v2"


def _token() -> str:
    load_dotenv(ROOT / ".env")
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        raise RuntimeError("APIFY_TOKEN is not set (check .env)")
    return token


def _actor_path(slug: str) -> str:
    return slug.replace("/", "~")


def run_actor(slug: str, run_input: dict, timeout: int = 300) -> list[dict]:
    """Run an actor synchronously and return its dataset items (clean=true)."""
    url = f"{_BASE}/acts/{_actor_path(slug)}/run-sync-get-dataset-items"
    try:
        resp = requests.post(
            url,
            params={"token": _token(), "clean": "true"},
            json=run_input,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        print(f"[apify] {slug}: request error {exc}")
        return []
    if resp.status_code >= 400:
        print(f"[apify] {slug}: HTTP {resp.status_code} {resp.text[:200]}")
        return []
    try:
        data = resp.json()
    except ValueError:
        print(f"[apify] {slug}: non-JSON response")
        return []
    return data if isinstance(data, list) else []
