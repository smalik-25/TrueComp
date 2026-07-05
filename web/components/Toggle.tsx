"use client";

import { useState } from "react";

// A small switch. Works uncontrolled (defaultOn) for demos, or controlled when
// given `checked` + `onChange` (the piece page lifts the state to recompute the
// bands when best-offer sales are excluded).
export function Toggle({
  label,
  defaultOn = false,
  checked,
  onChange,
}: {
  label: string;
  defaultOn?: boolean;
  checked?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const [internal, setInternal] = useState(defaultOn);
  const on = checked ?? internal;
  const toggle = () => {
    const next = !on;
    if (checked === undefined) setInternal(next);
    onChange?.(next);
  };
  return (
    <button
      type="button"
      className="toggle"
      data-on={on}
      role="switch"
      aria-checked={on}
      onClick={toggle}
    >
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
      {label}
    </button>
  );
}
