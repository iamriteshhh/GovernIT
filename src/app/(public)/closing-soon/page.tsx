import Link from "next/link";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { ExamCard } from "@/components/opportunity/ExamCard";
import { SchemeCard } from "@/components/opportunity/SchemeCard";
import { Clock, AlertTriangle } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: "Applications Closing Soon | GovernIT Urgent Deadlines",
  description: "Government exams and schemes with application windows shutting in the next 7 days. Apply before portals close.",
};

export default async function ClosingSoonPage() {
  const [closingSoonExams, closingSoonSchemes] = await Promise.all([
    examService.getClosingSoonExams(),
    schemeService.getClosingSoonSchemes(),
  ]);

  const totalUrgent = closingSoonExams.length + closingSoonSchemes.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Applications Closing Soon
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {totalUrgent} Urgent
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Government opportunities with deadlines closing within the next 7 days. Act promptly before portal links shut.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="h-4 w-4 text-amber-600" />
            Configured 7-Day Threshold
          </div>
        </div>
      </div>

      {/* Urgent Notice Banner */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Urgent Deadline Alert:</strong> Most official server portals experience heavy traffic on closing days. We recommend submitting applications at least 24 hours prior to deadline.
        </p>
      </div>

      {/* Closing Soon Exams */}
      {closingSoonExams.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recruitments & Exams Closing Soon ({closingSoonExams.length})
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoonExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Closing Soon Schemes */}
      {closingSoonSchemes.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Scholarships & Schemes Closing Soon ({closingSoonSchemes.length})
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {closingSoonSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </div>
      )}

      {totalUrgent === 0 && (
        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Clock className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            No applications closing within the next 7 days
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Check the general exams and schemes catalogues for longer-term deadlines.
          </p>
          <div className="mt-6">
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Browse All Opportunities
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
