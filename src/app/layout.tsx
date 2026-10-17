// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Syne } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "./components/service-worker";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APPLE_SPLASH_SCREENS,
  THEME_COLOR,
  appleSplashPath,
} from "./lib/brand";
import { Providers } from "./providers";

// Self-hosted at build time: no layout shift, and they keep working offline.
const display = Syne({ subsets: ["latin"], variable: "--font-syne" });
// Geist has true tabular digits, so the ticking timer and time columns don't jitter.
const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
    startupImage: APPLE_SPLASH_SCREENS.map((screen) => {
      const [width, height, ratio] = screen;
      return {
        url: appleSplashPath(screen),
        media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
      };
    }),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
  // Draw edge to edge on notched phones; the UI pads itself with safe-area insets.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
