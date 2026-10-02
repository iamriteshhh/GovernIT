import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { env } from "@/lib/env";

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
    "Discover officially verified government exams, recruitments, and citizen schemes with real-time Indian Standard Time deadlines, gazette notifications, and direct application links.",
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
      "100% officially verified national and state government exams, recruitments, and citizen welfare schemes with dynamic IST countdowns.",
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
      "Discover verified government exams and citizen schemes with live IST countdowns and official gazette citations.",
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
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {/* Skip to Main Content Link for WCAG Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-xl dark:focus:bg-white dark:focus:text-slate-900"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
          {children}
        </main>
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
