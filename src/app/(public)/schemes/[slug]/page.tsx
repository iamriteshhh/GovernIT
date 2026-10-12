import Link from "next/link";
import { notFound } from "next/navigation";
import { schemeService } from "@/server/services/scheme-service";
import { load } from "@/server/services/load";
import { describeProgramEnd } from "@/domain/status";
import { DeadlineStatus } from "@/components/opportunity/DeadlineStatus";
import { FreshnessBadge } from "@/components/opportunity/FreshnessBadge";
import { OfficialActions } from "@/components/opportunity/OfficialActions";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { FreshnessBanner, KeyDate, LifecycleBanner, SourcesAndVerification } from "@/components/opportunity/DetailParts";
import { formatDateTimeIST } from "@/lib/dates";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await load("SCHEME_META", () => schemeService.getSchemeBySlug(slug));
  if (!result.ok) return { title: "Government Scheme" };
  const scheme = result.data;
  if (!scheme) return { title: "Scheme Not Found" };

  const title = `${scheme.name} — Benefits, Eligibility & Official Links`;
  const description = `${scheme.name} by ${scheme.department.name}. Who can benefit: ${scheme.whoCanBenefit}`;
  return {
    title,
    description,
    alternates: { canonical: `/schemes/${scheme.slug}` },
    openGraph: { title, description, url: `/schemes/${scheme.slug}`, type: "article", siteName: "GovernIT" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await load("SCHEME_DETAIL", () => schemeService.getSchemeBySlug(slug));

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DataUnavailable what="this scheme" />
      </div>
    );
  }
  const scheme = result.data;
  if (!scheme) notFound();

  const period = scheme.applicationPeriod;
  const programEnd = describeProgramEnd(scheme.programEndsAt);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: scheme.name,
    serviceType: "Citizen Welfare Scheme",
    provider: { "@type": "GovernmentOrganization", name: scheme.department.name },
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://governit.in"}/schemes/${scheme.slug}`,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Link href="/schemes" className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold text-link hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All schemes
      </Link>

      <article className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <LifecycleBanner lifecycle={scheme.lifecycle} note={scheme.lifecycleNote} isArchived={scheme.isArchived} />
        <FreshnessBanner freshness={scheme.freshness} />

        <p className="flex flex-wrap items-center gap-2 text-base text-muted">
          <MapPin className="h-4 w-4" aria-hidden />
          {scheme.state ? `${scheme.state.name} state scheme` : "Central government scheme"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-fg">{scheme.name}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-base text-muted">
          <Building2 className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <span>{scheme.department.name}</span>
        </p>

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-line bg-surface-muted p-5">
          <DeadlineStatus
            layout="detail"
            opensAt={period?.opensAt ? new Date(period.opensAt).toISOString() : null}
            closesAt={period?.closesAt ? new Date(period.closesAt).toISOString() : null}
            isRolling={period?.isRolling ?? false}
            lifecycle={scheme.lifecycle}
            serverNow={new Date().toISOString()}
          />
          <OfficialActions
            size="detail"
            applyUrl={scheme.officialApplyUrl}
            linkKind={scheme.applyLinkKind}
            noticeUrl={scheme.noticeUrl}
            status={scheme.status.status}
            freshness={scheme.freshness}
            linkHealth={scheme.linkHealth}
          />
          <FreshnessBadge freshness={scheme.freshness} />
        </div>

        <section className="mt-8" aria-labelledby="dates-heading">
          <h2 id="dates-heading" className="text-xl font-bold text-fg">Application window (IST)</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KeyDate label="Applications open" value={period?.opensAt ? formatDateTimeIST(period.opensAt) : "Not published"} />
            <KeyDate
              label="Applications close (last date)"
              value={
                period?.closesAt
                  ? formatDateTimeIST(period.closesAt)
                  : period?.isRolling
                  ? "No fixed last date (continuous enrolment)"
                  : "Not announced"
              }
              emphasis={scheme.status.status === "CLOSING_SOON"}
            />
          </dl>
          {programEnd && (
            <p className="mt-3 rounded-xl border border-info-line bg-info-bg p-4 text-base text-info">
              <strong>{programEnd}.</strong> This is the end of the scheme itself, not the application deadline.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-info-line bg-info-bg p-6" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="text-xl font-bold text-info">Benefits</h2>
          <p className="mt-2 text-base text-fg">{scheme.benefits}</p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Eligibility and documents">
          {[
            { title: "Who can benefit", body: scheme.whoCanBenefit },
            { title: "Eligibility", body: scheme.eligibility },
            { title: "Documents needed", body: scheme.requiredDocuments },
            { title: "How to apply", body: scheme.applicationProcess },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-line p-5">
              <h3 className="text-base font-bold text-fg">{b.title}</h3>
              <p className="mt-2 whitespace-pre-line text-base text-muted">{b.body}</p>
            </div>
          ))}
        </section>

        <SourcesAndVerification sources={scheme.sources} verifications={scheme.verifications} />
      </article>
    </div>
  );
}
