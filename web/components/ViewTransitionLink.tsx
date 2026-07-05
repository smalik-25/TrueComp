"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

// Search-to-detail continuity via the View Transitions API (section 6.2), as a
// progressive enhancement. If the browser supports startViewTransition, the
// navigation animates; otherwise this is a plain Next Link with normal client
// navigation. Modified clicks (new tab, etc.) always behave normally. It cannot
// break navigation: the worst case is an instant, un-animated route change.
export function ViewTransitionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === "function") {
      e.preventDefault();
      doc.startViewTransition(() => router.push(href));
    }
    // else: fall through to Link's default navigation
  };

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
