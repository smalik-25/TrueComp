import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Backstop that deletes any query image left behind, e.g. a user who closed the
// tab before /api/visual-search deleted it. The happy path deletes immediately;
// this only sweeps orphans older than the window. Triggered by the Vercel cron in
// vercel.json. When CRON_SECRET is set Vercel sends it as a bearer and we enforce
// it; without it the route only ever deletes stale query orphans, so exposure is
// low, but setting CRON_SECRET is recommended.
const PREFIX = "query/";
const MAX_AGE_MS = 60 * 60 * 1000;

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cutoff = Date.now() - MAX_AGE_MS;
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const res = await list({ prefix: PREFIX, cursor, limit: 1000 });
    const stale = res.blobs
      .filter((b) => new Date(b.uploadedAt).getTime() < cutoff)
      .map((b) => b.url);
    if (stale.length) {
      await del(stale);
      deleted += stale.length;
    }
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return NextResponse.json({ deleted });
}
