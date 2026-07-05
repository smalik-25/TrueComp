import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueComp",
  description:
    "Sold comparables and repricing for luxury, archive, and avant-garde menswear.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            TrueComp
          </Link>
          <span className="tagline">archive menswear sold comps</span>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          Prices are USD-normalized. Every figure traces to a dbt mart. Grailed
          rows are undated (price level only); eBay drives the time-series.
        </footer>
      </body>
    </html>
  );
}
