"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { Wordmark } from "./Wordmark";

// The nav links. Method is the portfolio standout; Market is deferred (see
// plan 4.4) so it is intentionally absent until it is backed by real marts.
const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/identify", label: "Identify" },
  { href: "/method", label: "Method" },
  { href: "/underpriced", label: "Underpriced" },
  { href: "/colophon", label: "Colophon" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="topnav">
      <Container>
        <div className="topnav-inner">
          <Wordmark variant="nav" href="/" />
          <nav className="topnav-links" aria-label="Primary">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="navlink"
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </Container>
    </header>
  );
}
