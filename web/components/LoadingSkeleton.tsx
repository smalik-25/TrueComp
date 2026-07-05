// A placeholder while a route streams. The sweep animation is disabled under
// reduced-motion (globals.css), leaving a flat block that is still legible as a
// loading region. aria-hidden with a busy region on the wrapper.
export function LoadingSkeleton({
  lines = 3,
  variant = "lines",
}: {
  lines?: number;
  variant?: "lines" | "card";
}) {
  if (variant === "card") {
    return (
      <div className="card" aria-busy="true" aria-label="Loading">
        <div className="skeleton" style={{ height: 20, width: "60%" }} />
        <div className="skeleton" style={{ height: 14, width: "40%", marginTop: 12 }} />
        <div className="skeleton" style={{ height: 48, marginTop: 20 }} />
      </div>
    );
  }
  return (
    <div className="stack-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 14, width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
