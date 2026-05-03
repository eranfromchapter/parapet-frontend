import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://parapet-ai.com";
const SITE_TITLE = "PARAPET — AI-Powered Owner's Representative";
const SITE_DESCRIPTION =
  "Navigate your renovation with confidence. PARAPET provides unbiased, data-driven renovation planning with cost estimates, scope specifications, and matched contractors. No vendor kickbacks. Ever.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | PARAPET",
  },
  description: SITE_DESCRIPTION,
  applicationName: "PARAPET",
  keywords: [
    "renovation planning",
    "AI renovation",
    "owner's representative",
    "construction cost estimate",
    "contractor matching",
    "home renovation",
    "PARAPET",
  ],
  authors: [{ name: "New Parapet LLC" }],
  creator: "New Parapet LLC",
  publisher: "New Parapet LLC",
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  // Tells iOS Safari this is a Home-Screen-installable web app: drops the
  // browser chrome, uses a black-translucent status bar, and shows the
  // apple-touch-icon as the launcher icon. Next.js maps these to the
  // canonical apple-mobile-web-app-* meta tags in the rendered <head>.
  appleWebApp: {
    capable: true,
    title: "PARAPET",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "PARAPET",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PARAPET — Your AI-Powered Owner's Representative",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
  // Fills the entire screen on notched iPhones (XS+) so env(safe-area-inset-*)
  // resolves to the actual hardware insets instead of 0. Without this, the
  // BottomNav's pb-[max(8px,env(safe-area-inset-bottom))] silently collapses
  // to 8px and the home indicator overlaps the active tab icon.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
