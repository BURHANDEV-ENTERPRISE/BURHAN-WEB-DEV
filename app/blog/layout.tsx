import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | BURHANDEV",
  description: "Notes on building websites, from the BURHANDEV team.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
