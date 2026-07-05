// Shown when a search or filter returns nothing. Serif title, plain sans body.
// Sparse results are the normal case for archive pieces, so empty states are
// first-class, not an afterthought.
export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {body ? <p className="empty-body measure" style={{ marginInline: "auto" }}>{body}</p> : null}
      {children ? <div style={{ marginTop: "var(--space-5)" }}>{children}</div> : null}
    </div>
  );
}
