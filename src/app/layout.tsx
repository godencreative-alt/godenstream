import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import Navbar from "@/components/layout/Navbar";
import SectionNav from "@/components/layout/SectionNav";
import Footer from "@/components/layout/Footer";
import AdblockSW from "@/components/AdblockSW";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GodenStream — Anime, Film, Donghua, Komik & Entertainment",
    template: "%s | GodenStream",
  },
  description:
    "Stream anime, donghua, film, komik, dan entertainment favorit kamu — semua dalam satu tempat.",
  openGraph: {
    title: "GodenStream",
    description: "Streaming Anime, Donghua, Film, Komik & Entertainment",
    type: "website",
    siteName: "GodenStream",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[var(--dc-base)] text-white antialiased">
        <AdblockSW />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--dc-gold)] focus:px-4 focus:py-2 focus:text-zinc-900 focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>
          <Navbar />
          <SectionNav />
          <main id="main-content" className="min-h-[calc(100vh-8rem)]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
