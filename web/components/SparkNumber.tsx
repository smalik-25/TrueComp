// A mono figure meant to draw the eye. In Phase 6 this counts up to its value
// on first view (reduced-motion shows the final value); for now it renders the
// final value directly. Pass an already-formatted string from lib/format.
export function SparkNumber({
  value,
  className,
}: {
  value: React.ReactNode;
  className?: string;
}) {
  return <span className={`spark ${className ?? ""}`}>{value}</span>;
}
