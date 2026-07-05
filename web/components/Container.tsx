// The layout grid wrapper (section 2.3): a max-width column with wide,
// responsive outer margins. Renders as <div> by default; pass `as` to use a
// semantic element like <main>, <section>, or <aside>. When used as a landmark,
// forward `id` and `aria-label` so the landmark can be named.
export function Container({
  children,
  as: Tag = "div",
  className,
  id,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag className={`container ${className ?? ""}`} id={id} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
}
