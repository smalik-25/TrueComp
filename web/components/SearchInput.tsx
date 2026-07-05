"use client";

import { useState } from "react";

// The search field. Works uncontrolled (its own state) for the styleguide, or
// controlled when given `value` + `onChange` (the search page drives filtering
// from it). Body copy is sans; the query itself is the user's data.
export function SearchInput({
  placeholder = "Search a brand or a model",
  defaultValue = "",
  value,
  onChange,
}: {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (next: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const set = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return (
    <div className="search">
      <svg
        className="search-icon"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        className="search-input"
        type="search"
        value={current}
        placeholder={placeholder}
        aria-label="Search pieces"
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );
}
