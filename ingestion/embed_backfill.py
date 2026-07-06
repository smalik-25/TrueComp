"""Backfill image embeddings for the visual-search reference set.

Reads piece_image rows that have an image_url but no embedding, sends them in
batches to the Modal embedding worker (EMBED_ENDPOINT_URL, bearer EMBED_AUTH_TOKEN),
and writes the returned 768-dimension halfvec back to piece_image. Idempotent:
a run only touches rows still missing an embedding, so a partial run resumes and an
expired-URL failure simply retries next time. Runs offline (locally or in CI, never
on Vercel); the worker owns the model, this owns the database write.

Usage:
    python -m ingestion.embed_backfill              # embed everything missing
    python -m ingestion.embed_backfill --limit 50   # cap, for a smoke test
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

from ingestion.db import connect

ROOT = Path(__file__).resolve().parents[1]
BATCH = 48
REQUEST_TIMEOUT_S = 300


def _endpoint() -> tuple[str, str]:
    load_dotenv(ROOT / ".env")
    url = os.environ.get("EMBED_ENDPOINT_URL")
    tok = os.environ.get("EMBED_AUTH_TOKEN")
    if not url or not tok:
        raise SystemExit("EMBED_ENDPOINT_URL and EMBED_AUTH_TOKEN must be set (check .env)")
    return url, tok


def _embed(url: str, tok: str, urls: list[str]) -> dict:
    body = json.dumps({"urls": urls}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {tok}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
        return json.loads(resp.read())


def _vec_literal(emb: list[float]) -> str:
    return "[" + ",".join(repr(float(x)) for x in emb) + "]"


def run(limit: int | None = None) -> tuple[int, list[int]]:
    url, tok = _endpoint()
    with connect() as conn:
        with conn.cursor() as cur:
            q = (
                "select image_id, image_url from piece_image "
                "where image_url is not null and embedding is null order by image_id"
            )
            if limit:
                q += f" limit {int(limit)}"
            cur.execute(q)
            rows = cur.fetchall()

        total = len(rows)
        print(f"[backfill] {total} images to embed (batch {BATCH})")
        embedded = 0
        failed: list[int] = []

        for start in range(0, total, BATCH):
            chunk = rows[start : start + BATCH]
            ids = [r[0] for r in chunk]
            urls = [r[1] for r in chunk]
            t = time.time()
            try:
                out = _embed(url, tok, urls)
            except Exception as exc:  # noqa: BLE001 - one bad batch must not abort the rest
                failed.extend(ids)
                print(f"[backfill] batch at {start} failed, left null: {exc}")
                continue

            embeddings = out.get("embeddings") or []
            errors = out.get("errors") or []
            if len(embeddings) != len(ids):
                failed.extend(ids)
                print(f"[backfill] batch {start}: got {len(embeddings)}/{len(ids)}, null")
                continue

            params = []
            for image_id, emb in zip(ids, embeddings):
                if emb is None:
                    failed.append(image_id)
                else:
                    params.append((_vec_literal(emb), image_id))

            if params:
                with conn.cursor() as cur:
                    cur.executemany(
                        "update piece_image set embedding = %s::halfvec, embedded_at = now() "
                        "where image_id = %s",
                        params,
                    )
                conn.commit()
                embedded += len(params)

            done = start + len(chunk)
            print(
                f"[backfill] {done}/{total}  +{len(params)} ok  "
                f"{len(errors)} fetch-fail  {round(time.time() - t, 1)}s"
            )

        print(f"[backfill] done: embedded={embedded} failed={len(failed)}")
        if failed:
            print(f"[backfill] failed image_ids (left null, retry next run): {failed[:50]}")
    return embedded, failed


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()
    run(args.limit)
