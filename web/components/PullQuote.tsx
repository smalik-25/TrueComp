// An editorial pull quote: serif italic, oversized, with an oxblood rule.
// Reserved for the Method page argument, not decoration.
export function PullQuote({ children }: { children: React.ReactNode }) {
  return <blockquote className="pullquote">{children}</blockquote>;
}
