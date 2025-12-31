import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "PaintPile - Your Miniature Painting Journal",
    template: "%s | PaintPile",
  },
  description:
    "Track your miniature painting projects, manage your pile of shame, and document your progress from pile to painted.",
  keywords: ["miniature painting", "warhammer", "paint tracker", "hobby journal"],
  authors: [{ name: "PaintPile" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://paintpile.app",
    title: "PaintPile - Your Miniature Painting Journal",
    description: "Track your miniature painting journey",
    siteName: "PaintPile",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
