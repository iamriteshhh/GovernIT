import Link from "next/link";
import { ExamOpportunity } from "@/domain/exam";
import { SchemeOpportunity } from "@/domain/scheme";
import { describeProgramEnd } from "@/domain/status";
import { formatDateIST } from "@/lib/dates";
import { DeadlineStatus } from "./DeadlineStatus";
import { FreshnessBadge } from "./FreshnessBadge";
import { OfficialActions } from "./OfficialActions";
import { ArrowRight, Building2, MapPin } from "lucide-react";

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export function OpportunityCard({ item }: { item: ExamOpportunity | SchemeOpportunity }) {
  const isExam = item.kind === "exam";
  const href = isExam ? `/exams/${item.slug}` : `/schemes/${item.slug}`;
  const org = isExam ? item.conductingBody.name : item.department.name;
  const urgent = item.applicationStatus.status === "CLOSING_SOON";
  const programEnd = isExam ? null : describeProgramEnd(item.programEndsAt);

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border bg-surface p-5 shadow-card ${
        urgent ? "border-urgent-line border-2" : "border-line"
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-semibold text-fg">{isExam ? "Exam / recruitment" : "Scheme"}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden />
            {item.state ? item.state.name : "Central (all India)"}
          </span>
          {item.isArchived && (
            <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 font-semibold">Archived</span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold leading-snug text-fg">
          <Link href={href} className="hover:underline">
            {item.name}
          </Link>
        </h3>

        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{org}</span>
        </p>

        <div className="mt-4">
          <DeadlineStatus
            opensAt={iso(item.applicationPeriod?.opensAt)}
            closesAt={iso(item.applicationPeriod?.closesAt)}
            isRolling={item.applicationPeriod?.isRolling ?? false}
            lifecycle={item.lifecycle}
            serverNow={new Date().toISOString()}
          />
        </div>

        {isExam ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3 text-sm">
            <div>
              <dt className="text-muted">Exam date</dt>
              <dd className="font-semibold text-fg">{formatDateIST(item.examDate)}</dd>
            </div>
            <div>
              <dt className="text-muted">Vacancies</dt>
              <dd className="font-semibold text-fg">
                {item.vacancyCount ? item.vacancyCount.toLocaleString("en-IN") : "Not announced"}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-4 rounded-xl bg-surface-muted p-3 text-sm">
            <p className="text-muted">Benefit</p>
            <p className="mt-0.5 line-clamp-2 text-fg">{item.benefits}</p>
            {programEnd && <p className="mt-2 font-semibold text-fg">{programEnd}</p>}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
        <FreshnessBadge freshness={item.freshness} />
        <OfficialActions
          applyUrl={item.officialApplyUrl}
          linkKind={item.applyLinkKind}
          noticeUrl={item.noticeUrl}
          status={item.applicationStatus.status}
          freshness={item.freshness}
          linkHealth={item.linkHealth}
        />
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-base font-semibold text-link hover:underline">
          Full details <ArrowRight className="h-4 w-4" aria-hidden />
          <span className="sr-only">for {item.name}</span>
        </Link>
      </div>
    </article>
  );
}
