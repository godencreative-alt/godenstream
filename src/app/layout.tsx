import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import Navbar from "@/components/layout/Navbar";
import SectionNav from "@/components/layout/SectionNav";
import Footer from "@/components/layout/Footer";
import { getPublicSettings } from "@/lib/admin/store";

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  return {
    title: {
      default: settings.seo.title,
      template: settings.seo.titleTemplate,
    },
    description: settings.seo.description,
    keywords: settings.seo.keywords,
    icons: settings.whitelabel.faviconUrl ? { icon: settings.whitelabel.faviconUrl } : undefined,
    openGraph: {
      title: settings.whitelabel.siteName,
      description: settings.seo.description,
      type: "website",
      images: settings.seo.ogImageUrl ? [settings.seo.ogImageUrl] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--dc-base)] text-white antialiased">
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
