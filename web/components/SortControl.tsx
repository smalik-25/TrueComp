"use client";

import { useState } from "react";

export const SORT_OPTIONS = [
  { value: "comps", label: "Most comps" },
  { value: "median-desc", label: "Median high to low" },
  { value: "median-asc", label: "Median low to high" },
  { value: "confidence", label: "Confidence" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// A compact sort control. The label is mono (a technical control), the options
// sans. Uncontrolled for the styleguide, controlled when given value + onChange.
export function SortControl({
  value,
  onChange,
}: {
  value?: SortValue;
  onChange?: (next: SortValue) => void;
}) {
  const [internal, setInternal] = useState<SortValue>(SORT_OPTIONS[0].value);
  const current = value ?? internal;
  const set = (next: SortValue) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return (
    <label className="sort-control">
      <span className="sort-label">Sort</span>
      <select
        className="sort-select"
        value={current}
        aria-label="Sort results"
        onChange={(e) => set(e.target.value as SortValue)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
