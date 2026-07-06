"""Marqo-FashionSigLIP image-embedding worker for the visual-search reference set.

Stateless by design: given image URLs, it returns 768-dimension L2-normalized
image embeddings and nothing else. It owns no data. Two callers use it and must
embed through the same model and preprocessing so their vectors are comparable:
the offline backfill that indexes the reference images, and the query route at
search time. The worker runs on a scale-to-zero T4, so idle containers shut down
after `scaledown_window` and the meter only runs while it is actually embedding.

Deploy:
    modal deploy worker/embed.py

Modal prints a `*.modal.run` base URL. The embedding endpoint is that URL + /embed,
and that full string is EMBED_ENDPOINT_URL for the callers. Both callers send the
shared secret as an Authorization: Bearer <token> header; the worker reads the same
value from the Modal secret `reliquery-embed-auth` (key EMBED_AUTH_TOKEN) and
compares in constant time. A GET on the base URL returns a small health payload.

Request:  POST {"urls": ["https://...", ...]}   (max 64 per call)
Response: {"dim": 768, "count": N,
           "embeddings": [[...768 floats...] | null, ...],   # aligned to input order
           "errors": [{"index": i, "url": "...", "error": "..."}, ...]}
A null in `embeddings` means that URL failed to fetch or decode; see `errors`.
"""

import modal

MODEL_ID = "hf-hub:Marqo/marqo-fashionSigLIP"
EMBED_DIM = 768
MAX_URLS = 64
FETCH_TIMEOUT_S = 15.0
MAX_IMAGE_BYTES = 15 * 1024 * 1024


def _bake_weights() -> None:
    # Runs at image-build time so the model weights live in the image layer and
    # cold starts skip the Hugging Face download.
    import open_clip

    open_clip.create_model_and_transforms(MODEL_ID)


image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.4.1",
        "open_clip_torch==2.26.1",
        "timm==1.0.11",
        "pillow==10.4.0",
        "httpx==0.27.2",
        "fastapi==0.115.6",
    )
    .run_function(_bake_weights)
)

app = modal.App("reliquery-embed")


@app.cls(
    gpu="T4",
    image=image,
    scaledown_window=60,
    secrets=[modal.Secret.from_name("reliquery-embed-auth")],
)
class Embedder:
    @modal.enter()
    def load(self) -> None:
        import open_clip
        import torch

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        model, _, preprocess = open_clip.create_model_and_transforms(MODEL_ID)
        model.eval().to(self.device)
        self.model = model
        self.preprocess = preprocess

    def _embed_urls(self, urls: list[str]):
        import io

        import httpx
        import torch
        from PIL import Image

        embeddings: list = [None] * len(urls)
        errors: list = []
        tensors: list = []
        rows: list[int] = []

        with httpx.Client(timeout=FETCH_TIMEOUT_S, follow_redirects=True) as client:
            for i, url in enumerate(urls):
                try:
                    resp = client.get(url)
                    resp.raise_for_status()
                    content = resp.content
                    if len(content) > MAX_IMAGE_BYTES:
                        raise ValueError(f"image exceeds {MAX_IMAGE_BYTES} bytes")
                    pil = Image.open(io.BytesIO(content)).convert("RGB")
                    tensors.append(self.preprocess(pil))
                    rows.append(i)
                except Exception as exc:  # noqa: BLE001 - report per-image, never fail the batch
                    errors.append({"index": i, "url": url, "error": str(exc)})

        if tensors:
            batch = torch.stack(tensors).to(self.device)
            with torch.no_grad():
                feats = self.model.encode_image(batch, normalize=True)
            for j, row in enumerate(rows):
                embeddings[row] = feats[j].float().cpu().tolist()

        return embeddings, errors

    @modal.asgi_app()
    def web(self):
        import os

        from fastapi import FastAPI, HTTPException, Request

        api = FastAPI()

        def _authorize(request: Request) -> None:
            import hmac

            header = request.headers.get("authorization", "")
            token = header[7:].strip() if header[:7].lower() == "bearer " else ""
            expected = os.environ["EMBED_AUTH_TOKEN"]
            if not token or not hmac.compare_digest(token, expected):
                raise HTTPException(status_code=401, detail="unauthorized")

        @api.get("/")
        def health():
            return {"status": "ok", "model": MODEL_ID, "dim": EMBED_DIM, "device": self.device}

        @api.post("/embed")
        async def embed(request: Request):
            _authorize(request)
            payload = await request.json()
            urls = payload.get("urls") or []
            if not isinstance(urls, list):
                raise HTTPException(status_code=400, detail="`urls` must be a list")
            if len(urls) > MAX_URLS:
                raise HTTPException(status_code=400, detail=f"max {MAX_URLS} urls per call")
            embeddings, errors = self._embed_urls([str(u) for u in urls])
            return {
                "dim": EMBED_DIM,
                "count": len(urls),
                "embeddings": embeddings,
                "errors": errors,
            }

        return api
