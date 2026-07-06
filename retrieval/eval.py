"""Leave-one-out retrieval evaluation for visual search.

No fresh-photo holdout exists (the active-listing pull captured no images), so this
measures leave-one-out on the reference set: each embedded image is a query,
searched against every OTHER embedded image, and we ask whether the nearest matches
share its brand, model, and exact piece. piece_image keeps one image per listing
(unique on marketplace + source_listing_id), so a query's same-piece neighbours are
always different listings' photos, not near-duplicate crops of one listing. That
makes LOO a fair cross-listing test, but it still flatters real use: queries and
gallery are both resale listing photos, so a user's in-the-wild phone photo (odd
angle, lighting, background) will retrieve worse, most of all on the soft items.
The brand / model / piece granularity mirrors the site's confidence framing: brand
and archetype hold up, exact model and season are the "likely" hedge, and that
ordering should show up in the numbers.

Run:
    python -m retrieval.eval            # k=10, lenient + strict
    python -m retrieval.eval --k 5
"""
from __future__ import annotations

import argparse
from collections import defaultdict

from ingestion.db import connect

KS = (1, 5, 10)


def _identity(conn) -> dict[int, tuple[str | None, str | None]]:
    with conn.cursor() as cur:
        cur.execute("select piece_id, brand_norm, model_name from mart_piece_comps")
        return {pid: (brand, model) for pid, brand, model in cur.fetchall()}


def _counts(conn) -> dict[int, int]:
    # per piece: embedded images (>=2 means a same-piece hit is even possible)
    with conn.cursor() as cur:
        cur.execute(
            """
            select piece_id, count(*) filter (where embedding is not null)
            from piece_image group by piece_id
            """
        )
        return {pid: imgs for pid, imgs in cur.fetchall()}


def _neighbors(conn, k: int) -> dict[int, dict]:
    # For every embedded image, its top-k nearest OTHER embedded images by cosine.
    sql = """
      select q.image_id, q.piece_id, n.piece_id, n.rnk
      from piece_image q
      cross join lateral (
        select pi.piece_id,
               row_number() over (order by pi.embedding <=> q.embedding) as rnk
        from piece_image pi
        where pi.embedding is not null
          and pi.image_id <> q.image_id
        order by pi.embedding <=> q.embedding
        limit %s
      ) n
      where q.embedding is not null
    """
    by_query: dict[int, dict] = {}
    with conn.cursor() as cur:
        cur.execute("set hnsw.ef_search = 100")
        cur.execute(sql, (k,))
        for q_img, q_piece, n_piece, rnk in cur.fetchall():
            slot = by_query.setdefault(q_img, {"piece": q_piece, "nbrs": [None] * k})
            if 1 <= rnk <= k:
                slot["nbrs"][rnk - 1] = n_piece
    return by_query


def _pct(num: int, den: int) -> str:
    return f"{100.0 * num / den:5.1f}% (n={den})" if den else "  n/a (n=0)"


def _mini(num: int, den: int) -> str:
    return f"{100.0 * num / den:.0f}%" if den else "-"


def _row(name: str, hits: dict, den: int) -> str:
    return (f"{name:<7} rank-1: {_pct(hits[1], den)}   "
            f"hit@5: {_pct(hits[5], den)}   hit@10: {_pct(hits[10], den)}")


def run(k: int = 10) -> None:
    with connect() as conn:
        ident = _identity(conn)
        counts = _counts(conn)

        by_query = _neighbors(conn, k)

        brand_den = model_den = piece_den = 0
        brand_hit = {kk: 0 for kk in KS}
        model_hit = {kk: 0 for kk in KS}
        piece_hit = {kk: 0 for kk in KS}
        prec5_num = 0.0
        # per brand: [n_brand, brand_r1, n_model, model_r1, model_hit5]
        per_brand: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0, 0, 0])

        for q in by_query.values():
            q_piece = q["piece"]
            qb, qm = ident.get(q_piece, (None, None))
            nbrs = q["nbrs"]
            ni = [ident.get(p, (None, None)) if p is not None else (None, None) for p in nbrs]
            piece_eligible = counts.get(q_piece, 0) >= 2

            if qb is not None:
                brand_den += 1
                pb = per_brand[qb]
                pb[0] += 1
                for kk in KS:
                    if any(b == qb for b, _ in ni[:kk]):
                        brand_hit[kk] += 1
                if ni[0][0] == qb:
                    pb[1] += 1

                if qm is not None:
                    model_den += 1
                    pb[2] += 1
                    for kk in KS:
                        if any(b == qb and m == qm for b, m in ni[:kk]):
                            model_hit[kk] += 1
                    if ni[0] == (qb, qm):
                        pb[3] += 1
                    if any(x == (qb, qm) for x in ni[:5]):
                        pb[4] += 1

            if piece_eligible:
                piece_den += 1
                for kk in KS:
                    if any(p == q_piece for p in nbrs[:kk]):
                        piece_hit[kk] += 1
                prec5_num += sum(1 for p in nbrs[:5] if p == q_piece) / 5.0

        print(f"\n===== leave-one-out retrieval, k={k} =====")
        print(f"queries evaluated: {len(by_query)}")
        print(_row("brand", brand_hit, brand_den))
        print(_row("model", model_hit, model_den))
        print(_row("piece", piece_hit, piece_den))
        if piece_den:
            print(f"piece   precision@5: {100.0 * prec5_num / piece_den:5.1f}%")

        print("\nper-brand:")
        print(f"  {'brand':<24}{'n_br':>6}{'br_r1':>7}{'n_md':>6}{'md_r1':>7}{'md_h5':>7}")
        for brand, (nb, br1, nm, mr1, mh5) in sorted(
            per_brand.items(), key=lambda x: -x[1][0]
        ):
            print(f"  {brand:<24}{nb:>6}{_mini(br1, nb):>7}"
                  f"{nm:>6}{_mini(mr1, nm):>7}{_mini(mh5, nm):>7}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--k", type=int, default=10)
    args = ap.parse_args()
    run(args.k)
