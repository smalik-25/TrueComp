import type { Metadata } from "next";
import "./globals.css";
import { fraunces, inter, geistMono } from "./fonts";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Sold-comparable prices for archive and avant-garde menswear, resolved across marketplaces. Find what a piece is worth, not what it is listed at.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ReliQuery",
    template: "%s · ReliQuery",
  },
  description: DESCRIPTION,
  applicationName: "ReliQuery",
  openGraph: {
    title: "ReliQuery",
    description: DESCRIPTION,
    siteName: "ReliQuery",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReliQuery",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <GrainOverlay />
        <div className="shell">
          <TopNav />
          <main id="main" className="shell-main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
