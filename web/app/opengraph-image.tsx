import { ImageResponse } from "next/og";

// Open Graph card. Typographic, using the built-in font (no external font fetch,
// so it cannot fail on a missing asset). The wordmark split is preserved in
// color: Reli bone, Query oxblood.
export const alt = "ReliQuery, sold comparables for archive and avant-garde menswear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0E0C0B",
          color: "#E8E3D6",
        }}
      >
        <div style={{ display: "flex", fontSize: 150, fontWeight: 800, letterSpacing: "-5px" }}>
          <span>Reli</span>
          <span style={{ color: "#C6403A" }}>Query</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 46, color: "#A8A093", maxWidth: 940 }}>
          Find what a piece is worth, not what it is listed at.
        </div>
        <div style={{ display: "flex", marginTop: 44, fontSize: 26, color: "#6E675C" }}>
          Sold comps across Grailed and eBay, graded by sample size.
        </div>
      </div>
    ),
    { ...size },
  );
}
