"""Apply db/schema.sql to the database named by DATABASE_URL.

Used because psql is not guaranteed on the dev box. Equivalent to:
    psql "$DATABASE_URL" -f db/schema.sql

Reads DATABASE_URL from the environment or a local .env.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "db" / "schema.sql"


def main() -> int:
    load_dotenv(ROOT / ".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not set (check .env)", file=sys.stderr)
        return 1

    sql = SCHEMA_PATH.read_text()
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(
                "select table_name from information_schema.tables "
                "where table_schema = 'public' order by table_name"
            )
            tables = [r[0] for r in cur.fetchall()]
    print(f"applied {SCHEMA_PATH.relative_to(ROOT)}; public tables: {tables}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
