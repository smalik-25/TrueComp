"use client";

import { useEffect, useRef, useState } from "react";

// A scroll reveal that fades and lifts content in as it enters view (section
// 6.3). Fail-safe by construction: the element is VISIBLE by default (shown =
// true), so SSR, no-JS, and reduced-motion all render it in place. Only on the
// client, with motion allowed, for content still below the fold, does it hide
// and then reveal on scroll. Above-the-fold content is left visible, never
// animated in. Renders a plain wrapper div; the labeled SectionRule inside
// carries the section's structure.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (typeof window === "undefined" || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already in view: leave visible

    // Never hide content unless we can guarantee the mechanism to reveal it.
    if (typeof IntersectionObserver === "undefined") return;
    setShown(false);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-io ${className ?? ""}`} data-shown={shown}>
      {children}
    </div>
  );
}
