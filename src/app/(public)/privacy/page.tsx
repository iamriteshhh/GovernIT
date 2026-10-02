import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | GovernIT",
  description:
    "GovernIT's commitment to citizen privacy, minimal data retention, zero advertising trackers, and transparent civic data handling.",
};

export default function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          Zero-Tracker & Data Minimization Pledge
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Last updated: {lastUpdated} &bull; Operational scope: GovernIT Civic Discovery Platform
        </p>
      </div>

      {/* Content */}
      <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {/* Core Principles */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            1. Our Foundational Privacy Architecture
          </h2>
          <p className="mt-3">
            GovernIT is designed with a strict <strong>data minimization</strong> ethos. You can search, browse, and track government examinations and citizen welfare schemes freely without registering, logging in, or creating an account.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="font-semibold text-xs text-slate-900 dark:text-white">No User Tracking</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We do not employ third-party behavioral analytics, ad pixels, or commercial tracking tags.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="font-semibold text-xs text-slate-900 dark:text-white">Direct Authority Links</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Application submissions happen exclusively on authoritative government agency websites.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950">
              <span className="font-semibold text-xs text-slate-900 dark:text-white">Zero Data Monetization</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We never sell, rent, or trade user contact details, inquiries, or IP addresses to any third party.</p>
            </div>
          </div>
        </section>

        {/* Data We Collect */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Personal Information Collected &amp; Purpose
          </h2>
          <p>
            We collect personal information solely in the following limited situations:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Editorial Inquiries &amp; Feedback:</strong> If you submit a notification update, editorial correction, or message via our contact desk, we record your name, email address, and message content solely to investigate the report and respond to your inquiry.
            </li>
            <li>
              <strong>Security &amp; Abuse Prevention Logs:</strong> To prevent denial-of-service attacks, credential stuffing, and malicious scraping, our reverse proxies and servers temporarily log client IP addresses, timestamps, request URLs, and User-Agent headers. These server logs are automatically rotated and deleted after 30 days.
            </li>
            <li>
              <strong>Admin Editorial Authentication:</strong> Editorial team members who sign in have their administrative username and cryptographic session token stored in an encrypted, HTTP-only cookie.
            </li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Cookies and Storage Technologies
          </h2>
          <p>
            GovernIT does <strong>not</strong> use advertising cookies, marketing cookies, or tracking beacons.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Strictly Necessary Operational Cookies:</strong> For editorial administrators, a single cookie (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">governit_admin_session</code>) is set upon login to preserve administrative session state. This cookie is marked <code className="text-xs">HttpOnly</code>, <code className="text-xs">Secure</code>, and <code className="text-xs">SameSite=Lax</code>.
            </li>
            <li>
              <strong>Local Browser Storage:</strong> We may store your interface preference (such as dark/light mode preference or cookie disclosure acknowledgement) locally in your device&apos;s localStorage. No personal identifiers are contained in localStorage.
            </li>
          </ul>
        </section>

        {/* Third-Party Service Links */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. External Government Portals &amp; Third-Party Services
          </h2>
          <p>
            GovernIT links directly to official government bodies (e.g., UPSC, SSC, NTA, state public service commissions, national scholarship portals). When you click &ldquo;Apply Official&rdquo; or &ldquo;Official Portal&rdquo;, you leave GovernIT and navigate to the external agency&apos;s infrastructure. External sites maintain their own independent privacy notices and terms.
          </p>
        </section>

        {/* Citizen Rights */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Your Rights (Digital Personal Data Protection Act / DPDP &amp; Global Standards)
          </h2>
          <p>
            Under applicable data protection laws (including the Indian Digital Personal Data Protection Act), you have rights regarding your personal information:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Right to access information about data collected</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Right to request correction of inaccurate data</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Right to request deletion of contact feedback</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Right to file an editorial grievance</span>
            </div>
          </div>
        </section>

        {/* Contact & Grievance */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Contact &amp; Grievance Officer
          </h2>
          <p className="mt-2">
            If you have questions, privacy requests, or wish to exercise your data rights, contact our Data &amp; Editorial Desk:
          </p>
          <div className="mt-3 text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
            <p>Email: <a href="mailto:privacy@governit.in" className="text-emerald-600 underline dark:text-emerald-400">privacy@governit.in</a></p>
            <p>Desk: GovernIT Editorial &amp; Civic Information Transparency</p>
            <p>Address: [TODO: add registered office address for legal entity]</p>
          </div>
        </section>
      </div>

      {/* Back to Home Link */}
      <div className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800">
        <Link
          href="/"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          &larr; Return to GovernIT Home
        </Link>
      </div>
    </div>
  );
}
