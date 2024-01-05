import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Example site - Next Page Builder",
  description: "Example site for Next Page Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
