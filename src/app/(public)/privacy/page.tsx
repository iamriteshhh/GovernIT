import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "GovernIT's commitment to citizen privacy, minimal data retention, zero advertising trackers, and transparent civic data handling.",
};

export default function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success">
          <ShieldCheck className="h-4 w-4" />
          Zero-Tracker & Data Minimization Pledge
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">
          Last updated: {lastUpdated} &bull; Operational scope: GovernIT Civic Discovery Platform
        </p>
      </div>

      {/* Content */}
      <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted">
        {/* Core Principles */}
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h2 className="text-lg font-bold text-fg flex items-center gap-2">
            <Lock className="h-5 w-5 text-success" />
            1. Our Foundational Privacy Architecture
          </h2>
          <p className="mt-3">
            GovernIT is designed with a strict <strong>data minimization</strong> ethos. You can search, browse, and track government examinations and citizen welfare schemes freely without registering, logging in, or creating an account.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-muted p-3.5">
              <span className="font-semibold text-xs text-fg">No User Tracking</span>
              <p className="mt-1 text-xs text-muted">We do not employ third-party behavioral analytics, ad pixels, or commercial tracking tags.</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-muted p-3.5">
              <span className="font-semibold text-xs text-fg">Direct Authority Links</span>
              <p className="mt-1 text-xs text-muted">Application submissions happen exclusively on authoritative government agency websites.</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-muted p-3.5">
              <span className="font-semibold text-xs text-fg">Zero Data Monetization</span>
              <p className="mt-1 text-xs text-muted">We never sell, rent, or trade user contact details, inquiries, or IP addresses to any third party.</p>
            </div>
          </div>
        </section>

        {/* Data We Collect */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-fg">
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
          <h2 className="text-base font-bold text-fg">
            3. Cookies and Storage Technologies
          </h2>
          <p>
            GovernIT does <strong>not</strong> use advertising cookies, marketing cookies, or tracking beacons.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Strictly Necessary Operational Cookies:</strong> For editorial administrators, a single cookie (<code className="rounded bg-surface-muted px-1 py-0.5 text-xs text-fg">governit_admin_session</code>) is set upon login to preserve administrative session state. This cookie is marked <code className="text-xs">HttpOnly</code>, <code className="text-xs">Secure</code>, and <code className="text-xs">SameSite=Lax</code>.
            </li>
            <li>
              <strong>Local Browser Storage:</strong> We may store your interface preference (such as dark/light mode preference or cookie disclosure acknowledgement) locally in your device&apos;s localStorage. No personal identifiers are contained in localStorage.
            </li>
          </ul>
        </section>

        {/* Third-Party Service Links */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-fg">
            4. External Government Portals &amp; Third-Party Services
          </h2>
          <p>
            GovernIT links directly to official government bodies (e.g., UPSC, SSC, NTA, state public service commissions, national scholarship portals). When you click &ldquo;Apply Official&rdquo; or &ldquo;Official Portal&rdquo;, you leave GovernIT and navigate to the external agency&apos;s infrastructure. External sites maintain their own independent privacy notices and terms.
          </p>
        </section>

        {/* Citizen Rights */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-fg">
            5. Your Rights (Digital Personal Data Protection Act / DPDP &amp; Global Standards)
          </h2>
          <p>
            Under applicable data protection laws (including the Indian Digital Personal Data Protection Act), you have rights regarding your personal information:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Right to access information about data collected</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Right to request correction of inaccurate data</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Right to request deletion of contact feedback</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span>Right to file an editorial grievance</span>
            </div>
          </div>
        </section>

        {/* Contact & Grievance */}
        <section className="rounded-2xl border border-line bg-surface-muted p-6">
          <h2 className="text-base font-bold text-fg">
            6. Contact &amp; Grievance Officer
          </h2>
          <p className="mt-2">
            If you have questions, privacy requests, or wish to exercise your data rights, contact our Data &amp; Editorial Desk:
          </p>
          <div className="mt-3 text-xs space-y-1 font-mono text-muted">
            <p>Email: <a href="mailto:privacy@governit.in" className="text-success underline">privacy@governit.in</a></p>
            <p>Desk: GovernIT Editorial &amp; Civic Information Transparency</p>
            <p>Address: [TODO: add registered office address for legal entity]</p>
          </div>
        </section>
      </div>

      {/* Back to Home Link */}
      <div className="mt-12 border-t border-line pt-6">
        <Link
          href="/"
          className="text-xs font-semibold text-success hover:text-success"
        >
          &larr; Return to GovernIT Home
        </Link>
      </div>
    </div>
  );
}
