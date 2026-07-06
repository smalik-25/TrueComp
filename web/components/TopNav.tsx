"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "./Container";
import { Wordmark } from "./Wordmark";

// One link array drives the desktop row and the mobile menu. Underpriced
// Listings carries a live dot; it is the only view backed by live active asks.
const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/identify", label: "Identify" },
  { href: "/underpriced", label: "Underpriced Listings", live: true },
  { href: "/method", label: "How It Works" },
  { href: "/colophon", label: "Colophon" },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topnav">
      <Container>
        <div className="topnav-inner">
          <Wordmark variant="nav" href="/" />
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none">
              {open ? (
                <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" />
              ) : (
                <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" />
              )}
            </svg>
          </button>
          <nav id="primary-nav" className="topnav-links" data-open={open} aria-label="Primary">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="navlink"
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.live ? (
                    <>
                      <span className="nav-live-dot" aria-hidden="true" />
                      <span className="sr-only"> (live)</span>
                    </>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </Container>
    </header>
  );
}
