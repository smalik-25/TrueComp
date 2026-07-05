"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "comps", label: "Most comps" },
  { value: "median-desc", label: "Median high to low" },
  { value: "median-asc", label: "Median low to high" },
  { value: "confidence", label: "Confidence" },
];

// A compact sort control. The label is mono (a technical control), the options
// sans. Presentational in Phase 1; it will drive the results grid later.
export function SortControl() {
  const [value, setValue] = useState(OPTIONS[0].value);
  return (
    <label className="sort-control">
      <span className="sort-label">Sort</span>
      <select
        className="sort-select"
        value={value}
        aria-label="Sort results"
        onChange={(e) => setValue(e.target.value)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
