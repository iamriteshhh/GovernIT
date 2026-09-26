import Link from "next/link";
import { examService } from "@/server/services/exam-service";
import { organizationRepository } from "@/server/repositories/organization-repository";
import { ExamCard } from "@/components/opportunity/ExamCard";
import { BookOpen, ShieldCheck, Search, Filter, X } from "lucide-react";

export const revalidate = 60;

interface ExamsListingPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    state?: string;
    centralOnly?: string;
    status?: string;
  }>;
}

export default async function ExamsListingPage({ searchParams }: ExamsListingPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const categorySlug = params.category || undefined;
  const stateCode = params.state || undefined;
  const onlyCentral = params.centralOnly === "true";
  const statusFilter = params.status || "all";

  const [categories, states, { exams }] = await Promise.all([
    organizationRepository.findCategories(),
    organizationRepository.findStates(),
    examService.listExams({
      search,
      categorySlug,
      stateCode,
      onlyCentral,
      limit: 100,
    }),
  ]);

  // Apply in-memory status filter if selected
  let filteredExams = exams;
  if (statusFilter === "open") {
    filteredExams = exams.filter(
      (e) => e.applicationStatus.status === "APPLICATION_OPEN" || e.applicationStatus.status === "CLOSING_SOON"
    );
  } else if (statusFilter === "closing-soon") {
    filteredExams = exams.filter((e) => e.applicationStatus.status === "CLOSING_SOON");
  } else if (statusFilter === "upcoming") {
    filteredExams = exams.filter((e) => e.examScheduleStatus.status === "EXAM_UPCOMING");
  } else if (statusFilter === "closed") {
    filteredExams = exams.filter((e) => e.applicationStatus.status === "CLOSED");
  }

  const hasActiveFilters = Boolean(search || categorySlug || stateCode || onlyCentral || statusFilter !== "all");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Government Exams & Recruitments
              </h1>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {filteredExams.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Verified national and state recruitment opportunities, test schedules, and official application portals.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            100% Gazette Verified
          </div>
        </div>
      </div>

      {/* Filter and Search Form */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form method="GET" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search by exam name or department (e.g. UPSC, SSC, Banking, Railways)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              name="category"
              defaultValue={categorySlug ?? ""}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* State Select */}
            <select
              name="state"
              defaultValue={stateCode ?? ""}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="">All Locations (Central & States)</option>
              {states.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="open">Active / Open Applications</option>
              <option value="closing-soon">Applications Closing Soon (≤ 7 Days)</option>
              <option value="upcoming">Upcoming Exams Calendar</option>
              <option value="closed">Closed Applications</option>
            </select>

            {/* Submit Filter Button */}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Apply Filter
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Link
                href="/exams"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Grid of Results */}
      {filteredExams.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            No exams match your criteria
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search terms or clearing selected category and location filters.
          </p>
          <div className="mt-6">
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Reset All Filters
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
