import { AlertCircle, Scale, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | GovernIT",
  description:
    "Terms of service, independent civic platform disclaimer, and acceptable use guidelines for GovernIT.",
};

export default function TermsPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          <Scale className="h-4 w-4" />
          Civic Information Service Agreement
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Last updated: {lastUpdated} &bull; Please read carefully before using GovernIT
        </p>
      </div>

      {/* Prominent Independent Platform Notice */}
      <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50/70 p-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="text-xs leading-relaxed space-y-1.5">
            <p className="font-bold text-sm">Mandatory Independent Platform Notice</p>
            <p>
              GovernIT is an <strong>independent public information indexing and civic discovery platform</strong>. GovernIT is <strong>not affiliated with, associated with, authorized by, endorsed by, or in any way officially connected with the Government of India, any State Government, Union Territory administration, or any Ministry, Department, Commission (such as UPSC, SSC, NTA, IBPS, State PSCs), or Statutory Body</strong>.
            </p>
            <p>
              All official names, logos, acronyms, and marks cited on this site belong to their respective government entities. Their reference on GovernIT is strictly nominative for civic awareness and public reference.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using GovernIT (the &ldquo;Service&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions and our <Link href="/privacy" className="text-emerald-600 underline dark:text-emerald-400">Privacy Policy</Link>. If you do not agree to these terms, you should discontinue use of the platform.
          </p>
        </section>

        {/* 2. Nature of the Service */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Purpose &amp; Nature of the Platform
          </h2>
          <p>
            GovernIT aggregates, cross-references, and simplifies publicly released government recruitment announcements, exam calendars, and citizen welfare schemes. GovernIT does <strong>not</strong> accept job applications, process examinations, issue admit cards, or disburse welfare funds. All applications and fee transactions are executed directly on official agency portals.
          </p>
        </section>

        {/* 3. Verification & Zero-Fabrication Standard */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Verification &amp; Accuracy Disclaimer
          </h2>
          <p>
            We adhere to a strict editorial policy requiring every opportunity to reference an official gazette, recruitment notification, or ministry website with an audit timestamp. However:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Government bodies frequently issue corrigenda, date extensions, rescheduling notices, and syllabus revisions without prior warning.
            </li>
            <li>
              While GovernIT updates timelines promptly, <strong>the official gazette notification issued by the respective conducting body remains the sole legally authoritative document</strong>.
            </li>
            <li>
              Aspirants and citizens are strictly advised to double-check deadlines, age criteria, and qualifications on the official conducting body&apos;s website before submitting fees or taking critical actions.
            </li>
          </ul>
        </section>

        {/* 4. Acceptable Use */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Acceptable Use Policy
          </h2>
          <p>
            You agree to use GovernIT solely for lawful, personal, non-commercial civic discovery. You agree not to:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Deploy automated scrapers, bots, or crawlers that flood our infrastructure with excessive requests exceeding normal human browsing limits.</li>
            <li>Attempt to bypass rate limiters, reverse engineer security mechanisms, or probe for vulnerabilities.</li>
            <li>Submit fraudulent, automated spam or misleading inquiries to our editorial corrections desk.</li>
            <li>Misrepresent GovernIT as an official government agency or recruitment board.</li>
          </ul>
        </section>

        {/* 5. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, GovernIT, its editorial team, and operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Any inadvertent inaccuracy, omission, typographical error, or delayed update in exam dates or scheme eligibility.</li>
            <li>Downtime, server failure, or inability to access external government submission portals.</li>
            <li>Missed application deadlines, fee forfeiture, or disqualification from recruitment processes.</li>
          </ul>
        </section>

        {/* 6. Governing Law */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p className="mt-2">
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in connection with the Service shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            For questions or editorial notices regarding these terms, email: <a href="mailto:editorial@governit.in" className="text-emerald-600 underline dark:text-emerald-400">editorial@governit.in</a>
          </p>
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
