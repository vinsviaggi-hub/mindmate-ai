import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MindMate AI",
  description: "Il tuo coach motivazionale personale, sempre con te.",
  metadataBase: new URL("https://mindmate-ai-theta.vercel.app"),
  openGraph: {
    title: "MindMate AI",
    description: "Coaching motivazionale, istantaneo.",
    url: "/",
    siteName: "MindMate AI",
    images: [{ url: "/logo.svg", width: 1200, height: 630, alt: "MindMate AI" }],
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          background: "linear-gradient(180deg,#b7c8ff 0%, #c7baff 100%)",
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "20px",
        }}
      >
        {children}
      </body>
    </html>
  );
}
