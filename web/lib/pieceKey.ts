// The stable routing key for a piece.
//
// The marts key on piece_id, but the resolver recomputes piece_id on every run,
// so serial ids churn and would break shared or indexed URLs. mart_piece_comps
// does not carry a canonical_key column, but it exposes the four fields the
// resolver dedups on, so the read layer derives the stable key from those.
// The key depends only on the semantic identity of the piece, so it survives
// re-resolution. (A future mart could persist canonical_key directly; deriving
// it here keeps the read layer thin without a schema change.)
//
// Format: brand_norm|archetype|model_name|season_code, empty segment for null.
// None of these values contain a pipe, so the split is unambiguous.

export type PieceKeyParts = {
  brand_norm: string;
  archetype: string | null;
  model_name: string | null;
  season_code: string | null;
};

export function toPieceKey(p: PieceKeyParts): string {
  return [p.brand_norm, p.archetype ?? "", p.model_name ?? "", p.season_code ?? ""].join("|");
}

export function fromPieceKey(key: string): PieceKeyParts {
  const [brand_norm = "", archetype = "", model_name = "", season_code = ""] = key.split("|");
  return {
    brand_norm,
    archetype: archetype || null,
    model_name: model_name || null,
    season_code: season_code || null,
  };
}
