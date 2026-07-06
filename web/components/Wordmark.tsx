import Link from "next/link";

// One wordmark everywhere: CamelCase "ReliQuery", both halves the same size.
// Reli in the serif (the relic), Query in the mono and oxblood (the query). The
// split is by typeface and tone, never by size, so Query never sits smaller than
// Reli. The `nav` variant only scales the whole lockup down for the top bar and
// footer; it renders the identical CamelCase mark.

type Variant = "lockup" | "nav";

export function Wordmark({
  variant = "lockup",
  href,
  className,
  style,
}: {
  variant?: Variant;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const label = "ReliQuery";
  const inner = (
    <span
      className={`wordmark ${variant === "nav" ? "wordmark--nav" : ""} ${className ?? ""}`}
      style={style}
      aria-label={label}
    >
      <span className="wordmark-reli" aria-hidden="true">
        Reli
      </span>
      <span className="wordmark-query" aria-hidden="true">
        Query
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label}>
        {inner}
      </Link>
    );
  }
  return inner;
}
