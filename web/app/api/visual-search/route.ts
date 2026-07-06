import { NextResponse } from "next/server";
import { embedImageBase64 } from "@/lib/embed";
import { gradeMatch, searchByVector } from "@/lib/queries/visualSearch";

export const runtime = "nodejs";
// Cold-starting the GPU worker can take ~20s; give the request room.
export const maxDuration = 60;

// The browser downsizes the photo before posting, so this is only a safety cap.
const MAX_BYTES = 6 * 1024 * 1024;

// Embed the uploaded query image and return the nearest resolved pieces. The
// bytes go straight to the worker as base64 and are never stored anywhere: the
// vector is the only thing that outlives the request.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "no image provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const vec = await embedImageBase64(b64);
    const matches = await searchByVector(vec);
    const verdict = gradeMatch(matches);
    return NextResponse.json({ verdict, matches });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
