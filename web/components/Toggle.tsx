"use client";

import { useState } from "react";

// A small switch. The best-offer toggle on the piece page uses it to include or
// exclude best-offer sales from the bands. Uncontrolled here (Phase 1 demo);
// the piece page will lift state to recompute the displayed median.
export function Toggle({
  label,
  defaultOn = false,
}: {
  label: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      className="toggle"
      data-on={on}
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
    >
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
      {label}
    </button>
  );
}
