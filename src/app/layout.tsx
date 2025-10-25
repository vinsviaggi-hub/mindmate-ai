import React from "react";

export const metadata = {
  title: "MindMate AI",
  description: "Il tuo coach motivazionale AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <meta
          name="google-site-verification"
          content="XANl7z-tEh6p6jtungMF_nNCJraLWHgkhM8EAoXkzY"
        />
      </head>
      <body
        style={{
          fontFamily: "Arial, sans-serif",
          background: "#fafafa",
          margin: 0,
          padding: "20px",
        }}
      >
        {children}
      </body>
    </html>
  );
}
