"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { displayBrand, formatCount, formatUsd } from "@/lib/format";
import type { Verdict, VisualMatch } from "@/lib/queries/visualSearch";

type Status = "idle" | "working" | "done" | "error";
type Result = { verdict: Verdict; matches: VisualMatch[] };

const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT = ACCEPT_TYPES.join(",");
const MAX_BYTES = 15 * 1024 * 1024;

const TIER_LABEL: Record<Verdict["tier"], string> = {
  strong: "Strong match",
  likely: "Likely match",
  weak: "Low-confidence match",
  none: "No strong match",
};

function pieceHref(key: string): string {
  return `/piece/${encodeURIComponent(key)}`;
}

function VerdictLine({ verdict }: { verdict: Verdict }) {
  const { tier, brand, archetype, model } = verdict;
  if (tier === "none") {
    return (
      <p className="vs-verdict-sub">
        This does not clearly match any of the eighteen reference grails. The closest visual
        neighbours are shown below for transparency, but your piece may not be one of them.
      </p>
    );
  }
  if (!brand) {
    return (
      <p className="vs-verdict-sub">
        Not confident enough to name the brand. The closest reference pieces are below.
      </p>
    );
  }
  const type = archetype ? ` ${archetype}` : "";
  return (
    <p className="vs-verdict-sub">
      Looks like <strong>{displayBrand(brand)}</strong>
      {type}.{" "}
      {model
        ? tier === "strong"
          ? `Likely the ${model}.`
          : `Possibly the ${model}, though the exact model is a guess.`
        : "The exact model is uncertain."}
    </p>
  );
}

function MatchCard({ m, primary }: { m: VisualMatch; primary?: boolean }) {
  return (
    <Link href={pieceHref(m.canonical_key)} className={`vs-match${primary ? " vs-match-primary" : ""}`}>
      <div className="vs-match-id">
        <span className="vs-match-brand">{displayBrand(m.brand_norm)}</span>
        <span className="vs-match-line">
          {m.archetype ?? "unspecified"}
          {m.model_name ? ` · ${m.model_name}` : ""}
        </span>
      </div>
      <div className="vs-match-meta">
        <span className="vs-sim">{(m.similarity * 100).toFixed(0)}% similar</span>
        <span className="vs-price">
          {m.median_usd ? formatUsd(m.median_usd) : "n/a"}
          <span className="vs-price-range">
            {m.p10_usd && m.p90_usd ? ` (${formatUsd(m.p10_usd)}–${formatUsd(m.p90_usd)})` : ""}
          </span>
        </span>
        <span className="vs-comps">
          {formatCount(m.n_sold, "comp")} · grade {m.confidence_grade}
        </span>
      </div>
      {m.replica_hazard ? <span className="vs-replica">heavily faked · authenticate</span> : null}
    </Link>
  );
}

export function VisualSearch() {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Monotonic id so a slow earlier search cannot overwrite a newer one, and a
  // ref-tracked preview URL so it is revoked even if the component unmounts.
  const reqId = useRef(0);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const setPreviewUrl = useCallback((url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }, []);

  const reset = useCallback(() => {
    reqId.current += 1; // invalidate any in-flight search
    setStatus("idle");
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [setPreviewUrl]);

  const run = useCallback(
    async (file: File) => {
      if (!file.type || !ACCEPT_TYPES.includes(file.type)) {
        setError("Use a JPEG, PNG, or WebP image (HEIC is not supported yet).");
        setStatus("error");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image is over 15 MB. Try a smaller one.");
        setStatus("error");
        return;
      }
      const id = ++reqId.current;
      setError(null);
      setResult(null);
      setStatus("working");
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const blob = await upload(`query/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        const res = await fetch("/api/visual-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobUrl: blob.url }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `search failed (${res.status})`);
        }
        const data = (await res.json()) as Result;
        if (id !== reqId.current) return; // a newer search superseded this one
        setResult(data);
        setStatus("done");
      } catch (err) {
        if (id !== reqId.current) return;
        setError((err as Error).message);
        setStatus("error");
      }
    },
    [setPreviewUrl],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void run(file);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void run(file);
  };

  return (
    <div className="vs">
      <label
        className="vs-drop"
        data-busy={status === "working"}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} hidden />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="your upload" className="vs-preview" />
        ) : (
          <span className="vs-drop-copy">
            <strong>Drop a photo</strong> or click to choose. JPEG, PNG, or WebP.
          </span>
        )}
      </label>

      {status === "working" ? (
        <p className="vs-status">Embedding and searching. The model may cold-start, so give it ~20 seconds.</p>
      ) : null}
      {status === "error" ? (
        <p className="vs-status vs-status-error">
          {error}{" "}
          <button type="button" className="vs-link-btn" onClick={reset}>
            try again
          </button>
        </p>
      ) : null}

      {status === "done" && result ? (
        <div className="vs-results">
          <div className="vs-verdict" data-tier={result.verdict.tier}>
            <div className="vs-verdict-head">
              <span className="vs-verdict-tier">{TIER_LABEL[result.verdict.tier]}</span>
              {result.matches[0] ? (
                <span className="vs-verdict-sim">
                  top {(result.matches[0].similarity * 100).toFixed(0)}% similar
                </span>
              ) : null}
            </div>
            <VerdictLine verdict={result.verdict} />
          </div>

          {result.matches.length ? (
            <>
              <MatchCard m={result.matches[0]} primary />
              {result.matches.length > 1 ? (
                <>
                  <p className="vs-others-label">Other close matches</p>
                  <div className="vs-others">
                    {result.matches.slice(1).map((m) => (
                      <MatchCard key={m.piece_id} m={m} />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <p className="vs-status">No reference pieces came back for this image.</p>
          )}

          <button type="button" className="vs-link-btn vs-again" onClick={reset}>
            search another photo
          </button>
        </div>
      ) : null}

      <p className="vs-footnote">
        Visual search compares your photo to ~940 reference images of eighteen archive grails.
        Brand and type are reliable; exact model and season are best-guess. Accuracy is measured
        leave-one-out on resale listing photos, so an in-the-wild phone photo does worse, most of
        all on the soft items (Dior denim, Undercover graphics). Uploads are embedded and then
        deleted. See <Link href="/method">Method</Link>.
      </p>
    </div>
  );
}
