import Link from "next/link";
import { notFound } from "next/navigation";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { StatusBadge } from "@/components/opportunity/StatusBadge";
import { DaysLeftBadge } from "@/components/opportunity/DaysLeftBadge";
import { VerificationBadge } from "@/components/opportunity/VerificationBadge";
import { ExamCard } from "@/components/opportunity/ExamCard";
import { SchemeCard } from "@/components/opportunity/SchemeCard";
import { formatDateIST } from "@/lib/dates";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  ExternalLink, 
  MapPin, 
  CreditCard, 
  GraduationCap, 
  FileText, 
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const exam = await examService.getExamBySlug(slug);

    if (!exam) {
      return {
        title: "Exam Not Found | GovernIT",
      };
    }

    const title = `${exam.name} — Eligibility, Dates & Official Gazette`;
    const description = `Official details for ${exam.name} conducted by ${exam.conductingBody.name}. Eligibility: ${exam.educationEligibility}. Age: ${exam.ageEligibility}. Dynamic deadlines and direct official portal links.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/exams/${exam.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `/exams/${exam.slug}`,
        type: "article",
        siteName: "GovernIT",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Government Exam | GovernIT",
    };
  }
}


export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let exam = null;
  let suggestedSchemes: Awaited<ReturnType<typeof schemeService.listSchemes>>["schemes"] = [];
  let relatedExams: Awaited<ReturnType<typeof examService.listExams>>["exams"] = [];

  try {
    const [e, sRes, eRes] = await Promise.all([
      examService.getExamBySlug(slug),
      schemeService.listSchemes({ limit: 2 }),
      examService.listExams({ limit: 4 }),
    ]);
    exam = e;
    suggestedSchemes = sRes.schemes;
    relatedExams = eRes.exams.filter((item) => item.slug !== slug).slice(0, 3);
  } catch (error) {
    console.warn("[EXAM DETAIL] Database temporarily unavailable:", error);
  }

  if (!exam) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: exam.name,
    serviceType: "Government Recruitment Examination",
    provider: {
      "@type": "GovernmentOrganization",
      name: exam.conductingBody.name,
    },
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://governit.in"}/exams/${exam.slug}`,
    description: `Official details, eligibility criteria, and verified gazette notifications for ${exam.name}`,
    termsOfService: exam.officialApplyUrl,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back button */}

      <Link
        href="/exams"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all government exams
      </Link>

      {/* Main Container */}
      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge evaluation={exam.applicationStatus} size="md" />
            <DaysLeftBadge daysLeft={exam.applicationStatus.daysLeft} isUrgent={exam.applicationStatus.status === "CLOSING_SOON"} />
            {exam.state ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-slate-400" />
                {exam.state.name} State Recruitment
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                All-India Central Recruitment
              </span>
            )}
          </div>
          <VerificationBadge lastVerifiedAt={exam.lastVerifiedAt} />
        </div>

        {/* Title & Conducting Body */}
        <div className="mt-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {exam.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>{exam.conductingBody.name}</span>
            </div>
            {exam.department && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>&bull;</span>
                <span>{exam.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Callout Bar */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/30">
          <div>
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider dark:text-emerald-300">
              Official Application Portal
            </span>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Direct official submission link verified with government server.
            </p>
          </div>
          <a
            href={exam.officialApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-98"
          >
            Go to Official Portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Important Dates Grid */}
        <div className="mt-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Official Timeline & Dates (IST)
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Registration Opens
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {formatDateIST(exam.applicationPeriod?.opensAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider dark:text-amber-300">
                Application Deadline
              </span>
              <p className="mt-1 text-sm font-bold text-amber-950 dark:text-amber-100">
                {formatDateIST(exam.applicationPeriod?.closesAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Admit Card Release
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {formatDateIST(exam.admitCardDate)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
              <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider dark:text-blue-300">
                Examination Date
              </span>
              <p className="mt-1 text-sm font-bold text-blue-950 dark:text-blue-100">
                {formatDateIST(exam.examDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility & Key Requirements */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Educational Qualification */}
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm">Educational Qualification</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {exam.educationEligibility}
            </p>
          </div>

          {/* Age Limits */}
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm">Age Limits & Relaxations</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {exam.ageEligibility}
            </p>
          </div>

          {/* Vacancy Breakdown */}
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm">Total Vacancies</h3>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
              {exam.vacancyCount ? exam.vacancyCount.toLocaleString("en-IN") : "To be announced"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Officially published vacancy count by the conducting body.
            </p>
          </div>

          {/* Application Fee */}
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm">Application Fee</h3>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {exam.applicationFee ?? "Fee details to be announced"}
            </p>
          </div>
        </div>

        {/* Official Sources Audit Log */}
        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Authoritative Official Sources
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Per GovernIT verification policy, all data on this page was sourced and verified directly from the following official government links:
          </p>

          <ul className="mt-4 space-y-2.5">
            {exam.sources.map((source) => (
              <li
                key={source.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {source.title ?? "Official Gazette / Portal"}
                  </span>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    {source.url}
                  </p>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Verify Source <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actively Suggested Citizen Schemes for Aspirants */}
      {suggestedSchemes.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <Sparkles className="h-3 w-3" />
                Active Civic Suggestions
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Suggested Citizen Schemes &amp; Subsidies for Candidates
              </h2>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              Browse all schemes <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {suggestedSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </section>
      )}

      {/* Related Upcoming Examinations */}
      {relatedExams.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <BookOpen className="h-3 w-3" />
                Related Recruitments
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Other Verified Government Exams
              </h2>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Explore all exams <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {relatedExams.map((item) => (
              <ExamCard key={item.id} exam={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
