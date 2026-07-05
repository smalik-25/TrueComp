import Link from "next/link";

// The wordmark splits one word across two typefaces: Reli in the serif (the
// relic), Query in the mono (the query). That split is the whole design
// language. The mono is tuned down in CSS (.wordmark-query) so Query does not
// sit heavier than Reli. Two variants:
//   lockup  camel-case "ReliQuery", Query in oxblood  (hero, headings)
//   nav     all-caps "RELI·QUERY", tighter, bright accent  (top nav)

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
  const inner =
    variant === "nav" ? (
      <span className={`wordmark wordmark--nav ${className ?? ""}`} style={style} aria-label={label}>
        <span className="wordmark-reli" aria-hidden="true">
          Reli
        </span>
        <span className="wordmark-mid" aria-hidden="true">
          ·
        </span>
        <span className="wordmark-query" aria-hidden="true">
          Query
        </span>
      </span>
    ) : (
      <span className={`wordmark ${className ?? ""}`} style={style} aria-label={label}>
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
