import { MonitoredSource, Prisma } from "@prisma/client";
import { parseIstInput } from "@/validation/dates";

/** Fields of a parsed official notice needed to create an exam record. */
export interface NoticeFields {
  title: string;
  externalId: string;
  evidenceUrl: string;
  noticeUrl?: string | null;
  applyUrl?: string | null;
  opensAt?: string | null;
  closesAt?: string | null;
  examDate?: string | null;
  stateCode?: string | null;
}

function slugify(title: string, externalId: string) {
  const base = `${title}-${externalId}`
    .toLowerCase()
    .replace(/\(notification[^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return base || `notice-${Date.now()}`;
}

const asDate = (v: string | null | undefined, edge: "start" | "end") => {
  if (!v) return null;
  const d = parseIstInput(v, edge);
  if (!d) throw new Error(`Invalid date: ${v}`);
  return d;
};

/**
 * Creates an exam from official-source facts only. Eligibility text points to the notification
 * instead of inventing details. Used by admin approval (draft) and by auto-publish sources.
 */
export async function createExamFromNotice(
  tx: Prisma.TransactionClient,
  source: MonitoredSource,
  n: NoticeFields,
  opts: { publish: boolean; verifiedBy: string; verificationNote: string }
) {
  const org =
    (await tx.organization.findUnique({ where: { name: source.organization } })) ??
    (await tx.organization.create({ data: { name: source.organization, type: n.stateCode ? "STATE" : "CENTRAL" } }));
  const state = n.stateCode ? await tx.state.findUnique({ where: { code: n.stateCode } }) : null;

  const baseSlug = slugify(n.title, n.externalId);
  let slug = baseSlug;
  for (let i = 2; await tx.exam.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${baseSlug}-${i}`;

  return tx.exam.create({
    data: {
      name: n.title,
      slug,
      conductingBodyId: org.id,
      stateId: state?.id ?? null,
      educationEligibility: "See the official notification for educational qualifications.",
      ageEligibility: "See the official notification for age limits and relaxations.",
      examDate: asDate(n.examDate, "start"),
      officialApplyUrl: n.applyUrl ?? n.noticeUrl ?? source.url,
      applyLinkKind: n.applyUrl ? "APPLICATION_PORTAL" : "DEPARTMENT_SITE",
      externalRef: `${source.key}:${n.externalId}`,
      monitoredSourceId: source.id,
      isPublished: opts.publish,
      applicationPeriod: { create: { opensAt: asDate(n.opensAt, "start"), closesAt: asDate(n.closesAt, "end") } },
      sources: {
        create: [
          ...(n.noticeUrl ? [{ url: n.noticeUrl, type: "OFFICIAL_NOTIFICATION" as const, title: "Official notification" }] : []),
          { url: n.evidenceUrl, type: "OTHER_OFFICIAL" as const, title: `${source.name} listing` },
        ],
      },
      verifications: { create: { verifiedBy: opts.verifiedBy, notes: opts.verificationNote } },
    },
  });
}
