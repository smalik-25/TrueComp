// A numbered step in the method narrative. Mono step number, serif title, prose
// in Inter. The `reveal` class is the hook the scroll enhancement animates; the
// content is fully visible without it.
export function MethodStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="method-step reveal">
      <span className="method-step-n">{String(n).padStart(2, "0")}</span>
      <div className="method-step-body">
        <h2 className="method-step-title">{title}</h2>
        <div className="method-step-prose measure">{children}</div>
      </div>
    </section>
  );
}
