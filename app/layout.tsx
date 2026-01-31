import type { Metadata } from "next";
import { Inter, Cinzel, Caveat } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CommandMenu } from "@/components/ui/CommandMenu";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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

import { Toaster } from 'sonner';

import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${caveat.variable}`}>
      <body className="antialiased font-sans">
        <AuthProvider>
          {children}
          <CommandMenu />
          <Toaster position="top-center" richColors />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
