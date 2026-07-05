"""Parse DATABASE_URL into PG* environment assignments for dbt.

Prints `PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... PGDATABASE=... PGSSLMODE=...`
on one line so it can be fed to `env $(python scripts/pg_env.py) dbt ...`.
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    load_dotenv(ROOT / ".env")
    url = os.environ["DATABASE_URL"]
    p = urlparse(url)
    q = parse_qs(p.query)
    pairs = {
        "PGHOST": p.hostname or "",
        "PGPORT": str(p.port or 5432),
        "PGUSER": p.username or "",
        "PGPASSWORD": p.password or "",
        "PGDATABASE": (p.path or "/").lstrip("/"),
        "PGSSLMODE": (q.get("sslmode", ["require"])[0]),
    }
    print(" ".join(f"{k}={v}" for k, v in pairs.items()))


if __name__ == "__main__":
    main()
