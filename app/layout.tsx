import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import Script from "next/script";
import "../src/styles.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const siteUrl = "https://dev.burhan.my";
const title = "BURHANDEV | Web Developer Services";
const description =
  "BURHANDEV builds landing pages, business websites, product UI, and custom web tools for Malaysian teams.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "BURHANDEV",
    images: ["/brand/burhan-logo2.webp"],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/brand/burhan-logo2.webp"],
  },
};

// Content-Security-Policy — this is a fully static export (no API routes,
// no forms, no server) so most directives stay tight to 'self'. script-src
// and style-src need 'unsafe-inline' because Next.js writes its own inline
// hydration-payload <script> tags at build time (no server means no
// per-request nonce to allowlist them individually) and React/JS write
// inline style="" attributes across the scroll-driven components. This
// still blocks the two most common real XSS payloads — loading a REMOTE
// injected <script src="attacker.com">, and exfiltrating data via
// fetch/XHR/beacon to another origin (connect-src 'self') — it just can't
// stop a purely inline injected script the way a nonce-based CSP would.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={bebasNeue.variable}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <Script src="/boot.js" strategy="beforeInteractive" />
        <style>{`
          html.is-booting { background: #fff6dc; }
          html.is-booting #app { visibility: hidden; }
          noscript #app, html:not(.is-booting) #app { visibility: visible; }
        `}</style>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
