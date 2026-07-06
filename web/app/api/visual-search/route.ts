import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { embedImageUrl } from "@/lib/embed";
import { gradeMatch, searchByVector } from "@/lib/queries/visualSearch";

export const runtime = "nodejs";
// Cold-starting the GPU worker can take ~20s; give the request room.
export const maxDuration = 60;

// The browser downsizes the photo before posting, so this is only a safety cap.
const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  let blobUrl: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "no image provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    // Store the (already downscaled) query image just long enough for the worker
    // to fetch it, then delete it in the finally. It is never persisted, and the
    // URL comes from our own put(), so there is nothing external to guard against.
    const blob = await put("query/q.jpg", bytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    blobUrl = blob.url;
    const vec = await embedImageUrl(blobUrl);
    const matches = await searchByVector(vec);
    const verdict = gradeMatch(matches);
    return NextResponse.json({ verdict, matches });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  } finally {
    if (blobUrl) {
      try {
        await del(blobUrl);
      } catch {
        // best-effort; the daily sweep clears any crash-orphan
      }
    }
  }
}
