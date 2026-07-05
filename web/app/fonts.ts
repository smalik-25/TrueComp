import { Fraunces, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";

// The relic voice: high-contrast variable serif. opsz axis gives optical
// sizing so display lines get the sharp, engraved cut and body-scale names
// stay readable. Italic reserved for pull quotes.
export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// The connective tissue: neutral sans for body copy and functional UI.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// The query voice: technical monospace, self-hosted by the geist package.
// Exposes --font-geist-mono. Every number on the site is set in this face.
export const geistMono = GeistMono;
