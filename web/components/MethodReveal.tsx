"use client";

import { useEffect, useRef } from "react";

// Scroll-driven reveals for the method narrative, as a progressive enhancement.
// Every `.reveal` element is fully visible by default (see globals.css); GSAP
// only animates it in from a slight offset, and only when motion is allowed. If
// GSAP fails to load or JS is off, the narrative reads as a plain static page.
export function MethodReveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let killed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: { revert: () => void } | undefined;

    (async () => {
      try {
        const gsapMod = await import("gsap");
        const stMod = await import("gsap/ScrollTrigger");
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        if (killed || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          const items = gsap.utils.toArray<HTMLElement>(".reveal");
          items.forEach((el) => {
            gsap.fromTo(
              el,
              { opacity: 0.35, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 85%" },
              },
            );
          });
        }, root);
      } catch {
        // content stays visible; nothing else to do
      }
    })();

    return () => {
      killed = true;
      ctx?.revert();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
