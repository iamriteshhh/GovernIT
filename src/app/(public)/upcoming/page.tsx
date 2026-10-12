import { examService } from "@/server/services/exam-service";
import { load } from "@/server/services/load";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { formatDateIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Upcoming Exam Calendar",
  description: "Upcoming government exam dates in date order (IST), with verification status and official links.",
};

export default async function UpcomingExamsPage() {
  const result = await load("UPCOMING_EXAMS", () => examService.getUpcomingExams());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Upcoming exam calendar</h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          Exams with a published exam date, soonest first. Exam dates can change: check each listing&apos;s
          &ldquo;Last verified&rdquo; date and the official notification.
        </p>
      </header>

      {!result.ok ? (
        <DataUnavailable what="exam dates" />
      ) : result.data.length > 0 ? (
        <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((exam) => (
            <li key={exam.id} className="flex flex-col gap-2">
              <p className="text-base font-bold text-fg">Exam on {formatDateIST(exam.examDate)}</p>
              <OpportunityCard item={exam} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center text-base text-muted">
          No upcoming exam dates are listed right now.
        </p>
      )}
    </div>
  );
}
