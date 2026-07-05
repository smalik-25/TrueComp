import type { Metadata } from "next";
import "./globals.css";
import { fraunces, inter, geistMono } from "./fonts";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ReliQuery",
    template: "%s · ReliQuery",
  },
  description:
    "Sold-comparable prices for archive and avant-garde menswear, resolved across marketplaces. Find what a piece is worth, not what it is listed at.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${geistMono.variable}`}>
      <body>
        <GrainOverlay />
        <div className="shell">
          <TopNav />
          <main className="shell-main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
