import "server-only";
import postgres from "postgres";

// Single pooled postgres.js client, server-only. Neon autosuspends, so the
// pool stays small and reconnects on cold start. Never import into client code.
//
// Phase 1 is the design system and shell: nothing renders from the database
// yet. The client is wired here so lib/queries/* can land in Phase 2 without
// re-plumbing. Pages are statically generated with daily revalidation, so a
// cold Neon start is masked by the cache, not paid on the request path.
//
// Initialization is lazy: the client is created on first query, not at import.
// That keeps a missing DATABASE_URL from throwing during a build-time prerender
// of a route that never actually reads the database.

const globalForSql = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy web/.env.local.example to web/.env.local.");
  }
  // SSL is governed by the connection string (Neon carries ?sslmode=require);
  // postgres.js parses sslmode itself, so no manual ssl option is passed.
  return postgres(url, { max: 3, idle_timeout: 20 });
}

// Call db() to get the client. Memoized per process (and per module in dev, so
// hot reload does not leak pools). Usage in Phase 2: db()`select ... from mart`.
export function db(): ReturnType<typeof postgres> {
  if (!globalForSql._sql) {
    globalForSql._sql = connect();
  }
  return globalForSql._sql;
}
