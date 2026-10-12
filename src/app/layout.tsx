import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { env } from "@/lib/env";
import { themeInitScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "GovernIT | One-Stop Government Opportunity Finder",
    template: "%s | GovernIT",
  },
  description:
    "Find Indian government exams, recruitments and schemes: application deadlines in IST, verification status, and links to the official portals.",
  keywords: [
    "Government Exams",
    "UPSC",
    "SSC",
    "Banking Jobs",
    "Railway Recruitment",
    "Government Schemes",
    "Sarkari Result",
    "Citizen Welfare",
    "Scholarships",
    "GovernIT",
  ],
  authors: [{ name: "GovernIT Editorial Team" }],
  creator: "GovernIT",
  publisher: "GovernIT",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "GovernIT",
    title: "GovernIT | One-Stop Government Opportunity Finder",
    description:
      "Indian government exams, recruitments and welfare schemes with IST deadlines, verification status and official links.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GovernIT - One-Stop Government Opportunity Finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GovernIT | One-Stop Government Opportunity Finder",
    description:
      "Government exams and schemes with IST deadlines, verification status and official links.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // data-theme is set by the inline script before hydration; React must not "fix" it.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-fg antialiased">
        {/* Skip to Main Content Link for WCAG Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-primary-fg"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
