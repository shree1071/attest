import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attest — Give one testimonial, get five back",
  description:
    "Collect testimonials for free, trade reviews with other founders, and embed a wall of reviewer snapshots on your site.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
