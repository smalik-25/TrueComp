import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { embedImageUrl } from "@/lib/embed";
import { searchByVector, gradeMatch } from "@/lib/queries/visualSearch";

export const runtime = "nodejs";
// Cold-starting the GPU worker can take ~20s; give the request room.
export const maxDuration = 60;

// Only fetch our own Vercel Blob URLs. Parsing with URL (not a regex) removes the
// anchor and newline-smuggling class outright; if BLOB_PUBLIC_HOST is set we pin
// to this app's exact store host, otherwise we allow any Vercel Blob host.
function isOwnBlob(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const pinned = process.env.BLOB_PUBLIC_HOST;
  if (pinned) return url.hostname === pinned;
  return url.hostname.endsWith(".public.blob.vercel-storage.com");
}

export async function POST(request: Request): Promise<NextResponse> {
  let blobUrl: string | undefined;
  try {
    const body = (await request.json()) as { blobUrl?: string };
    blobUrl = body.blobUrl;
    if (!blobUrl || !isOwnBlob(blobUrl)) {
      return NextResponse.json({ error: "invalid image reference" }, { status: 400 });
    }
    const vec = await embedImageUrl(blobUrl);
    const matches = await searchByVector(vec);
    const verdict = gradeMatch(matches);
    return NextResponse.json({ verdict, matches });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  } finally {
    // The query image is transient: drop it the moment it is embedded.
    if (blobUrl) {
      try {
        await del(blobUrl);
      } catch {
        // best-effort cleanup; a leftover blob expires on its own
      }
    }
  }
}
