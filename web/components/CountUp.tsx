"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsd, formatInt } from "@/lib/format";

// A mono figure that ticks up to its value once, on first view (section 6.4).
// Fail-safe: the initial (SSR and pre-hydration) render is the FINAL value, so
// no-JS and reduced-motion both show the real number immediately. The animation
// only runs on the client, when motion is allowed and IntersectionObserver
// exists, and only the first time the element scrolls into view. The rAF loop
// is cancelled on unmount, and the effect resets its state each run so a changed
// value re-animates rather than sticking.
export function CountUp({
  value,
  kind = "int",
  className,
  durationMs = 900,
}: {
  value: number;
  kind?: "usd" | "int";
  className?: string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    // No client, no observer, or reduced motion: show the final value, no animation.
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined" ||
      !el ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setDisplay(value * eased);
        if (t < 1) rafId = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect();
            run();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [value, durationMs]);

  const n = Math.round(display);
  const text = kind === "usd" ? formatUsd(n) : formatInt(n);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
