import Link from "next/link";
import { ExamOpportunity } from "@/domain/exam";
import { StatusBadge } from "./StatusBadge";
import { DaysLeftBadge } from "./DaysLeftBadge";
import { VerificationBadge } from "./VerificationBadge";
import { formatDateIST } from "@/lib/dates";
import { 
  Building2, 
  ExternalLink, 
  ArrowRight,
  MapPin 
} from "lucide-react";

interface ExamCardProps {
  exam: ExamOpportunity;
}

export function ExamCard({ exam }: ExamCardProps) {
  const isClosingSoon = exam.applicationStatus.status === "CLOSING_SOON";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
        isClosingSoon
          ? "border-amber-300 ring-1 ring-amber-400/30 hover:border-amber-400 dark:border-amber-800"
          : "border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge evaluation={exam.applicationStatus} />
            {exam.state ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3 text-slate-400" />
                {exam.state.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Central Govt
              </span>
            )}
          </div>
          <DaysLeftBadge
            daysLeft={exam.applicationStatus.daysLeft}
            isUrgent={isClosingSoon}
          />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-base sm:text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-200">
          <Link href={`/exams/${exam.slug}`}>
            {exam.name}
          </Link>
        </h3>

        {/* Conducting Body */}
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{exam.conductingBody.name}</span>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Application Deadline
            </span>
            <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIST(exam.applicationPeriod?.closesAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Exam Date
            </span>
            <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIST(exam.examDate)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Vacancies
            </span>
            <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {exam.vacancyCount ? exam.vacancyCount.toLocaleString("en-IN") : "Not announced"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Application Fee
            </span>
            <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200 truncate" title={exam.applicationFee ?? "TBA"}>
              {exam.applicationFee ?? "TBA"}
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exam.categories.map((c) => (
            <span
              key={c.id}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
        <VerificationBadge lastVerifiedAt={exam.lastVerifiedAt} />

        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={`/exams/${exam.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Full Details <ArrowRight className="h-3 w-3" />
          </Link>

          <a
            href={exam.officialApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Apply Official <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
