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
  AlertTriangle,
  Search,
  Calendar
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let closingSoonExams: Awaited<ReturnType<typeof examService.getClosingSoonExams>> = [];
  let allExams = { exams: [] as any[], total: 0 };
  let allSchemes = { schemes: [] as any[], total: 0 };

  try {
    const [c, e, s] = await Promise.all([
      examService.getClosingSoonExams(),
      examService.listExams({ limit: 4 }),
      schemeService.listSchemes({ limit: 4 }),
    ]);
    closingSoonExams = c;
    allExams = e;
    allSchemes = s;
  } catch (error) {
    console.warn("[HOME] Database temporarily unavailable:", error);
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
              100% Officially Verified Government Opportunities
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              One Stop for Every <br />
              <span className="text-slate-800 dark:text-slate-200">
                Government Opportunity
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Stop navigating dozens of fragmented portals. Discover UPSC, SSC, Banking, and State recruitments alongside Central & State citizen welfare schemes — with real-time Indian Standard Time deadlines and authoritative gazette citations.
            </p>

            {/* Quick Unified Search Bar */}
            <form action="/exams" method="GET" className="mt-8 mx-auto max-w-xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search exams, recruitments, or schemes (e.g. UPSC, SSC, Banking)..."
                  aria-label="Search opportunities"
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-28 text-sm text-slate-900 shadow-md placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Active Suggestion Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Actively Suggested:</span>
              <Link
                href="/exams?search=UPSC"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                UPSC Civil Services
              </Link>
              <Link
                href="/exams?search=SSC"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                SSC CGL
              </Link>
              <Link
                href="/exams?search=Railway"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                Railway RRB
              </Link>
              <Link
                href="/exams?search=Banking"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                Banking / IBPS
              </Link>
              <Link
                href="/schemes"
                className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-purple-700 hover:border-purple-300 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
              >
                Welfare Schemes
              </Link>
              <Link
                href="/upcoming"
                className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
              >
                Upcoming Calendar
              </Link>
            </div>

            {/* Action Navigation Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <BookOpen className="h-4 w-4" />
                Browse All Exams
              </Link>
              <Link
                href="/schemes"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4 text-slate-500" />
                Explore Citizen Schemes
              </Link>
              <Link
                href="/closing-soon"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
              >
                <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                Closing Soon ({closingSoonExams.length})
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Section (Closing Soon) */}
      {closingSoonExams.length > 0 && (
        <section className="border-b border-amber-200/80 bg-amber-50/40 py-12 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    Applications Closing Soon
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Opportunities with deadlines within 7 days. Act before official portals close.
                  </p>
                </div>
              </div>
              <Link
                href="/closing-soon"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200"
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                Employment & Recruitments
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Featured Government Exams
              </h2>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                Citizen Welfare & Benefits
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Key Citizen Schemes & Subsidies
              </h2>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
              <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                GovernIT Zero-Fabrication Standard
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Public information should be reliable, transparent, and accurate. Every detail published on GovernIT is audited directly against official government gazettes, notifications, and ministry guidelines.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Direct Official Sources</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Every opportunity references an official gazette notification, ministry guideline, or application portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Transparent Audit Timestamps</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Know exactly when dates, vacancy counts, and guidelines were last confirmed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">IST Timezone Accuracy</h3>
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
