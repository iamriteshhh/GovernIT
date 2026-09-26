import Link from "next/link";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { ExamCard } from "@/components/opportunity/ExamCard";
import { SchemeCard } from "@/components/opportunity/SchemeCard";
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export const revalidate = 60; // short TTL cache for read performance

export default async function HomePage() {
  const [closingSoonExams, allExams, allSchemes] = await Promise.all([
    examService.getClosingSoonExams(),
    examService.listExams({ limit: 4 }),
    schemeService.listSchemes({ limit: 4 }),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 py-16 sm:py-24 dark:border-slate-800/80 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-xs dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Officially Verified Government Opportunities
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              One Stop for Every <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Government Opportunity
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Stop navigating dozens of outdated portals. Discover UPSC, SSC, Banking, and State recruitments alongside Central & State citizen welfare schemes — with real-time Indian Standard Time deadlines and verified direct links.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30"
              >
                <BookOpen className="h-4 w-4" />
                Browse All Exams
              </Link>
              <Link
                href="/schemes"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-600/30"
              >
                <Sparkles className="h-4 w-4" />
                Explore Citizen Schemes
              </Link>
              <Link
                href="/closing-soon"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 transition-all hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
              >
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Closing Soon ({closingSoonExams.length})
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Urgency Section (Closing Soon) */}
      {closingSoonExams.length > 0 && (
        <section className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/50 py-12 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    Applications Closing Soon
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Opportunities with deadlines within 7 days. Act before portals close.
                  </p>
                </div>
              </div>
              <Link
                href="/closing-soon"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400"
              >
                View all closing soon ({closingSoonExams.length}) <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {closingSoonExams.slice(0, 3).map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Government Exams */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <BookOpen className="h-3.5 w-3.5" />
                Employment & Recruitments
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Featured Government Exams
              </h2>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Explore all exams <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {allExams.exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Citizen Welfare Schemes */}
      <section className="border-t border-slate-200 bg-slate-50/50 py-12 sm:py-16 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                Citizen Welfare & Benefits
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Key Citizen Schemes & Subsidies
              </h2>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              Explore all schemes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {allSchemes.schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Verification Promise */}
      <section className="border-t border-slate-200 py-12 sm:py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs sm:p-12 dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                GovernIT Zero-Fabrication Promise
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                We believe public information should be reliable, transparent, and accurate. Every detail published on GovernIT is audited against official sources.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Direct Official Sources</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Every opportunity references an official gazette notification, ministry guideline, or application portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Transparent Audit Timestamps</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Know exactly when dates, vacancy counts, and guidelines were last confirmed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">IST Timezone Accuracy</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Day-left countdowns calculate dynamically according to Indian Standard Time calendar days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
