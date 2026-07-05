import Link from "next/link";
import { searchPieces, topPieces, type PieceComp } from "@/lib/db";

export const dynamic = "force-dynamic";

function money(x: string | null): string {
  if (x == null) return "n/a";
  return `$${Math.round(Number(x)).toLocaleString()}`;
}

function PieceCard({ p }: { p: PieceComp }) {
  const label = [p.brand_norm, p.model_name, p.archetype]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={`/piece/${p.piece_id}`} className="card">
      <div className="brand">{p.brand_norm}</div>
      <div className="name">
        {p.model_name ?? p.archetype ?? "unspecified"}
        {p.season_code ? ` · ${p.season_code}` : ""}
      </div>
      <div className="row">
        <span>{money(p.median_usd)} median</span>
        <span className={`badge ${p.confidence_grade}`}>
          {p.confidence_grade}
        </span>
      </div>
      <div className="row muted" style={{ marginTop: 4 }}>
        <span>{p.n_sold} comps</span>
        <span title={label}>{p.archetype ?? ""}</span>
      </div>
    </Link>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const pieces = q ? await searchPieces(q) : await topPieces();

  return (
    <>
      <form className="search" action="/" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search a brand, model, or archetype (e.g. rick ramones, margiela gat)"
          autoFocus
        />
        <button type="submit">Search</button>
      </form>

      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        {q
          ? `${pieces.length} piece${pieces.length === 1 ? "" : "s"} for "${q}"`
          : "Most-comped pieces"}
      </p>

      {pieces.length === 0 ? (
        <p className="muted">No resolved pieces match that. Try a brand name.</p>
      ) : (
        <div className="grid">
          {pieces.map((p) => (
            <PieceCard key={p.piece_id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}
