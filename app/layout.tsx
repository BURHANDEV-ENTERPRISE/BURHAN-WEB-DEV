import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "../src/styles.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={`${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("is-booting");setTimeout(function(){document.documentElement.classList.remove("is-booting");},3000);`,
          }}
        />
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
