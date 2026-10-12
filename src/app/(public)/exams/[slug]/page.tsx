import Link from "next/link";
import { notFound } from "next/navigation";
import { examService } from "@/server/services/exam-service";
import { load } from "@/server/services/load";
import { DeadlineStatus } from "@/components/opportunity/DeadlineStatus";
import { FreshnessBadge } from "@/components/opportunity/FreshnessBadge";
import { OfficialActions } from "@/components/opportunity/OfficialActions";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { FreshnessBanner, KeyDate, LifecycleBanner, SourcesAndVerification } from "@/components/opportunity/DetailParts";
import { formatDateIST, formatDateTimeIST } from "@/lib/dates";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await load("EXAM_META", () => examService.getExamBySlug(slug));
  if (!result.ok) return { title: "Government Exam" };
  const exam = result.data;
  if (!exam) return { title: "Exam Not Found" };

  const title = `${exam.name} — Dates, Eligibility & Official Links`;
  const description = `${exam.name} by ${exam.conductingBody.name}. Eligibility: ${exam.educationEligibility}. Age: ${exam.ageEligibility}.`;
  return {
    title,
    description,
    alternates: { canonical: `/exams/${exam.slug}` },
    openGraph: { title, description, url: `/exams/${exam.slug}`, type: "article", siteName: "GovernIT" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ExamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await load("EXAM_DETAIL", () => examService.getExamBySlug(slug));

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DataUnavailable what="this exam" />
      </div>
    );
  }
  const exam = result.data;
  if (!exam) notFound();

  const period = exam.applicationPeriod;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: exam.name,
    serviceType: "Government Recruitment Examination",
    provider: { "@type": "GovernmentOrganization", name: exam.conductingBody.name },
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://governit.in"}/exams/${exam.slug}`,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Link href="/exams" className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-link hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All exams
      </Link>

      <article className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <LifecycleBanner lifecycle={exam.lifecycle} note={exam.lifecycleNote} isArchived={exam.isArchived} />
        <FreshnessBanner freshness={exam.freshness} />

        <p className="flex flex-wrap items-center gap-2 text-base text-muted">
          <MapPin className="h-4 w-4" aria-hidden />
          {exam.state ? `${exam.state.name} state recruitment` : "Central government recruitment (all India)"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg">{exam.name}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-base text-muted">
          <Building2 className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {exam.conductingBody.name}
            {exam.department ? ` · ${exam.department}` : ""}
          </span>
        </p>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-line bg-surface-muted p-5">
          <DeadlineStatus
            layout="detail"
            opensAt={period?.opensAt ? new Date(period.opensAt).toISOString() : null}
            closesAt={period?.closesAt ? new Date(period.closesAt).toISOString() : null}
            isRolling={period?.isRolling ?? false}
            lifecycle={exam.lifecycle}
            serverNow={new Date().toISOString()}
          />
          <OfficialActions
            size="detail"
            applyUrl={exam.officialApplyUrl}
            linkKind={exam.applyLinkKind}
            noticeUrl={exam.noticeUrl}
            status={exam.applicationStatus.status}
            freshness={exam.freshness}
            linkHealth={exam.linkHealth}
          />
          <FreshnessBadge freshness={exam.freshness} />
        </div>

        <section className="mt-8" aria-labelledby="dates-heading">
          <h2 id="dates-heading" className="text-xl font-bold text-fg">Important dates (IST)</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KeyDate label="Registration opens" value={period?.opensAt ? formatDateTimeIST(period.opensAt) : "Not announced"} />
            <KeyDate
              label="Registration closes (last date)"
              value={period?.closesAt ? formatDateTimeIST(period.closesAt) : "Not announced"}
              emphasis={exam.applicationStatus.status === "CLOSING_SOON"}
            />
            <KeyDate label="Admit card" value={formatDateIST(exam.admitCardDate)} />
            <KeyDate label="Exam date" value={`${formatDateIST(exam.examDate)} · ${exam.examScheduleStatus.statusLabel}`} />
          </dl>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Eligibility and fees">
          {[
            { title: "Education", body: exam.educationEligibility },
            { title: "Age limit", body: exam.ageEligibility },
            { title: "Vacancies", body: exam.vacancyCount ? exam.vacancyCount.toLocaleString("en-IN") : "Not announced" },
            { title: "Application fee", body: exam.applicationFee ?? "Not announced" },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-line p-5">
              <h3 className="text-base font-bold text-fg">{b.title}</h3>
              <p className="mt-2 text-base text-muted">{b.body}</p>
            </div>
          ))}
        </section>

        <SourcesAndVerification sources={exam.sources} verifications={exam.verifications} />
      </article>
    </div>
  );
}
