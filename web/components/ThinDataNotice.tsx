// A visible, honest notice that a piece rests on few comps, and what the price
// falls back to. This surfaces the honesty rule (section 7) in the UI rather
// than in fine print. Default copy states the brand-and-archetype fallback.
export function ThinDataNotice({
  title = "Thin data",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="notice" role="note">
      <p className="notice-title">{title}</p>
      <p className="notice-body">
        {children ??
          "Too few sold comps for a piece-level read. The recommendation falls back to the brand-and-archetype median, and the confidence grade reflects it."}
      </p>
    </div>
  );
}
