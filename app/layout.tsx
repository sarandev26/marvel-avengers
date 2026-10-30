import type { Metadata, Viewport } from "next";
import { Anton, Chakra_Petch } from "next/font/google";
import "./globals.css";

// Impact display face for the giant titles.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// Sci-fi HUD face for kickers, labels and UI.
const chakra = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avengers-experience.vercel.app";
const description =
  "Earth's mightiest heroes unite in an interactive, scroll-orchestrated cinematic experience. Designed & developed by Saran. A Marvel-inspired fan concept.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AVENGERS — Cinematic Scroll Experience",
  description,
  authors: [{ name: "Saran" }],
  creator: "Saran",
  keywords: [
    "Avengers",
    "Marvel",
    "Iron Man",
    "Thanos",
    "Endgame",
    "cinematic trailer",
    "scroll experience",
    "Next.js",
    "React Three Fiber",
    "Three.js",
    "GSAP",
    "WebGL",
    "creative development",
  ],
  openGraph: {
    title: "AVENGERS — Cinematic Scroll Experience",
    description,
    url: siteUrl,
    siteName: "AVENGERS",
    type: "website",
    images: [{ url: "/story/panel-1.jpg", width: 1200, height: 675, alt: "AVENGERS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVENGERS — Cinematic Scroll Experience",
    description,
    images: ["/story/panel-1.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#05030f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${chakra.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
