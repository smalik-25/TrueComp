"use client";

import { useState } from "react";

// The search field. Presentational in Phase 1: it holds its own value and
// echoes the current query in mono. Submit wiring (view-transition into
// /search) lands with the search page. Body copy is sans; the echoed query is
// mono because it is data the user typed.
export function SearchInput({
  placeholder = "Search a brand or a model",
  defaultValue = "",
}: {
  placeholder?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
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
        value={value}
        placeholder={placeholder}
        aria-label="Search pieces"
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
