import { examService } from "@/server/services/exam-service";
import { ExamCard } from "@/components/opportunity/ExamCard";
import { Calendar, ShieldCheck } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: "Upcoming Exam Calendar | GovernIT",
  description: "Chronological schedule of confirmed upcoming government exams, recruitments, and admit card release dates.",
};

export default async function UpcomingExamsPage() {
  const upcomingExams = await examService.getUpcomingExams();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Upcoming Exams Calendar
              </h1>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {upcomingExams.length} Scheduled
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track officially scheduled examination dates, admit-card releases, and cycle milestones in chronological order.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            IST Calendar Dynamic
          </div>
        </div>
      </div>

      {/* Info callout */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
        <Calendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p>
          Exam schedules are actively synchronized with official public service commission gazettes. Countdown days represent calendar days in India Standard Time.
        </p>
      </div>

      {/* Grid of Upcoming Exams */}
      {upcomingExams.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            No upcoming exams currently scheduled
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            New exam dates will appear here immediately as conducting bodies release official calendars.
          </p>
        </div>
      )}
    </div>
  );
}
