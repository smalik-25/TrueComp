import Link from "next/link";

// Base button. Renders a Link when given href, otherwise a button. `primary`
// fills with oxblood; reserve it for the single most important action on a view.
export function Button({
  children,
  href,
  primary = false,
  type = "button",
}: {
  children: React.ReactNode;
  href?: string;
  primary?: boolean;
  type?: "button" | "submit";
}) {
  const className = `btn ${primary ? "btn--primary" : ""}`;
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={className}>
      {children}
    </button>
  );
}
