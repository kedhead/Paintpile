import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: {
    default: "PaintPile - Your Miniature Painting Journal",
    template: "%s | PaintPile",
  },
  description:
    "Track your miniature painting projects, manage your pile of shame, and document your progress from pile to painted.",
  keywords: ["miniature painting", "warhammer", "paint tracker", "hobby journal"],
  authors: [{ name: "PaintPile" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PaintPile',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
import { PWAProvider } from '@/contexts/PWAContext';

import { ViewTransitions } from 'next-view-transitions';

import { PresenceTracker } from '@/components/social/PresenceTracker';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" className={`${inter.variable} ${cinzel.variable} ${caveat.variable}`}>
        <head>
          {/* iOS Splash Screens */}
          <link rel="apple-touch-startup-image" href="/splash/iphone-8.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-xr.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-x.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-12.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-14-pro.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-14-pro-max.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
          <link rel="apple-touch-startup-image" href="/splash/iphone-15-pro-max.png" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" />
        </head>
        <body className="antialiased font-sans">
          <AuthProvider>
            <PWAProvider>
              {children}
              <CommandMenu />
              <Toaster position="top-center" richColors />
              <InstallPrompt />
              <PresenceTracker />
            </PWAProvider>
          </AuthProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
