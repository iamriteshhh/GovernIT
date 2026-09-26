import Link from "next/link";
import { notFound } from "next/navigation";
import { schemeService } from "@/server/services/scheme-service";
import { StatusBadge } from "@/components/opportunity/StatusBadge";
import { DaysLeftBadge } from "@/components/opportunity/DaysLeftBadge";
import { VerificationBadge } from "@/components/opportunity/VerificationBadge";
import { formatDateIST } from "@/lib/dates";
import { 
  ArrowLeft, 
  Building2, 
  Sparkles, 
  FileText, 
  Users, 
  ExternalLink, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  Clock 
} from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scheme = await schemeService.getSchemeBySlug(slug);

  if (!scheme) {
    return {
      title: "Scheme Not Found | GovernIT",
    };
  }

  return {
    title: `${scheme.name} | GovernIT Guidelines & Benefits`,
    description: `Eligibility criteria, benefits summary, required documents, and official application process for ${scheme.name}.`,
  };
}

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scheme = await schemeService.getSchemeBySlug(slug);

  if (!scheme) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all citizen schemes
      </Link>

      {/* Main Container */}
      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge evaluation={scheme.status} size="md" />
            <DaysLeftBadge daysLeft={scheme.status.daysLeft} isUrgent={scheme.status.status === "CLOSING_SOON"} />
            {scheme.state ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-slate-400" />
                {scheme.state.name} State Scheme
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                Central Sector Scheme
              </span>
            )}
          </div>
          <VerificationBadge lastVerifiedAt={scheme.lastVerifiedAt} />
        </div>

        {/* Title & Department */}
        <div className="mt-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {scheme.name}
          </h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{scheme.department.name}</span>
          </div>
        </div>

        {/* Action Callout Bar */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-purple-800 dark:bg-purple-950/30">
          <div>
            <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider dark:text-purple-300">
              Official Ministry Portal
            </span>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Direct application, beneficiary registration, and verification desk.
            </p>
          </div>
          <a
            href={scheme.officialApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-500 active:scale-98"
          >
            Apply on Official Portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Benefits Highlight Box */}
        <div className="mt-8 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 p-6 dark:border-purple-900/60 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold">Key Benefits & Financial Assistance</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
            {scheme.benefits}
          </p>
        </div>

        {/* Core Scheme Breakdown Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Who Can Benefit */}
          <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm">Target Beneficiaries</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {scheme.whoCanBenefit}
            </p>
          </div>

          {/* Eligibility Criteria */}
          <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm">Eligibility Criteria</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {scheme.eligibility}
            </p>
          </div>

          {/* Required Documents */}
          <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm">Required Documents Checklist</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {scheme.requiredDocuments}
            </p>
          </div>

          {/* Application Deadline */}
          <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm">Application Deadline</h3>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              {scheme.deadline ? formatDateIST(scheme.deadline) : "Ongoing Enrollment (No Fixed Deadline)"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Subject to budget allocations and annual verification.
            </p>
          </div>
        </div>

        {/* Step-by-Step Application Process */}
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm">How to Apply (Process Guidelines)</h3>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
            {scheme.applicationProcess}
          </p>
        </div>

        {/* Authoritative Guidelines Sources */}
        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Authoritative Official Guidelines
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All details on this page were verified directly against authoritative government gazettes and ministry portals:
          </p>

          <ul className="mt-4 space-y-2.5">
            {scheme.sources.map((source) => (
              <li
                key={source.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {source.title ?? "Official Guidelines / Portal"}
                  </span>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    {source.url}
                  </p>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Verify Source <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
