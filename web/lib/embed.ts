import "server-only";

// Calls the Modal embedding worker (a scale-to-zero GPU). Cold starts can take
// ~20s, so the calling route sets maxDuration to cover it; the fetch is bounded a
// little under that. Sends one image as base64 bytes and returns its 768-d
// L2-normalized embedding. (The worker also accepts URLs, which the backfill uses.)
const ENDPOINT = process.env.EMBED_ENDPOINT_URL;
const TOKEN = process.env.EMBED_AUTH_TOKEN;
const EMBED_DIM = 768;

export async function embedImageBase64(b64: string): Promise<number[]> {
  if (!ENDPOINT || !TOKEN) {
    throw new Error("EMBED_ENDPOINT_URL / EMBED_AUTH_TOKEN are not set");
  }
  if (!ENDPOINT.startsWith("https://")) {
    throw new Error("EMBED_ENDPOINT_URL must be an https URL (the bearer token is sent to it)");
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ images_b64: [b64] }),
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
  });
  if (!res.ok) {
    throw new Error(`embed worker returned ${res.status}`);
  }
  const data = (await res.json()) as {
    dim: number;
    embeddings: (number[] | null)[];
    errors?: { index: number; error?: string }[];
  };
  const vec = data.embeddings?.[0];
  if (!vec || vec.length !== EMBED_DIM) {
    const reason = data.errors?.[0]?.error ?? "no usable vector (image decode failed)";
    throw new Error(`embed worker: ${reason}`);
  }
  return vec;
}
