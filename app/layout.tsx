import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "BURHANDEV | Web Developer Services",
  description:
    "BURHANDEV builds landing pages, business websites, product UI, and custom web tools for Malaysian teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("is-booting");`,
          }}
        />
        <style>{`
          html.is-booting { background: #fff6dc; }
          html.is-booting #app { visibility: hidden; }
          noscript #app, html:not(.is-booting) #app { visibility: visible; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
