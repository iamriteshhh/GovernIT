import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "@/server/services/audit";
import { parseIstInput } from "@/validation/dates";
import { createExamFromNotice } from "./create-exam";

export class ReviewError extends Error {}

interface Corrections {
  opensAt?: string | null;
  closesAt?: string | null;
  examDate?: string | null;
  officialApplyUrl?: string;
}

type Proposed = Record<string, unknown>;

const asDate = (v: unknown, edge: "start" | "end"): Date | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = parseIstInput(String(v), edge);
  if (!d) throw new ReviewError(`Invalid date: ${String(v)}`);
  return d;
};


/**
 * Applies an admin decision to a queued candidate. Approving writes the change, an audit entry
 * and a verification record naming the reviewer and the evidence URL. Rejecting changes no data.
 */
export async function reviewCandidate(id: string, decision: { action: "approve" | "reject"; note: string; corrections?: Corrections }, reviewer: string) {
  return db.$transaction(async (tx) => {
    const c = await tx.changeCandidate.findUnique({ where: { id }, include: { source: true } });
    if (!c) throw new ReviewError("Candidate not found");
    if (c.state !== "PENDING") throw new ReviewError(`Already ${c.state.toLowerCase()}`);

    const reviewed = { reviewedBy: reviewer, reviewedAt: new Date(), reviewNote: decision.note };

    if (decision.action === "reject") {
      await tx.changeCandidate.update({ where: { id }, data: { state: "REJECTED", ...reviewed } });
      await writeAudit({ actor: reviewer, action: "review.reject", entityType: "change_candidate", entityId: id, changes: { note: decision.note } }, tx);
      return { state: "REJECTED" as const };
    }

    const p: Proposed = { ...(c.proposed as Proposed), ...(decision.corrections ?? {}) };
    const evidence = c.evidenceUrl ?? "official source";
    let entity: { type: string; id: string } | null = null;
    let applied: Record<string, unknown> = {};

    switch (c.kind) {
      case "NEW_OPPORTUNITY": {
        if (!c.source) throw new ReviewError("Candidate has no source");
        // Drafts stay private until an admin completes eligibility details and publishes.
        const exam = await createExamFromNotice(
          tx,
          c.source,
          {
            title: String(p.title ?? c.title),
            externalId: String(c.externalId ?? ""),
            evidenceUrl: evidence,
            noticeUrl: (p.noticeUrl as string | null) ?? null,
            applyUrl: (p.applyUrl as string | null) ?? null,
            opensAt: (p.opensAt as string | null) ?? null,
            closesAt: (p.closesAt as string | null) ?? null,
            examDate: (p.examDate as string | null) ?? null,
            stateCode: (p.stateCode as string | null) ?? null,
          },
          { publish: false, verifiedBy: reviewer, verificationNote: `Approved from ${evidence}: ${decision.note}` }
        );
        entity = { type: "exam", id: exam.id };
        applied = { created: exam.slug, published: false };
        break;
      }

      case "DATE_CHANGE":
      case "LINK_CHANGE": {
        if (!c.examId) throw new ReviewError("Candidate is not linked to an exam");
        const opensAt = asDate(p.opensAt, "start");
        const closesAt = asDate(p.closesAt, "end");
        const examDate = asDate(p.examDate, "start");
        const officialApplyUrl = typeof p.officialApplyUrl === "string" ? p.officialApplyUrl : undefined;
        const period = {
          ...(opensAt !== undefined ? { opensAt } : {}),
          ...(closesAt !== undefined ? { closesAt } : {}),
        };
        await tx.exam.update({
          where: { id: c.examId },
          data: {
            ...(examDate !== undefined ? { examDate } : {}),
            ...(officialApplyUrl ? { officialApplyUrl } : {}),
            ...(Object.keys(period).length
              ? { applicationPeriod: { upsert: { create: { opensAt: period.opensAt ?? null, closesAt: period.closesAt ?? null }, update: period } } }
              : {}),
            verifications: { create: { verifiedBy: reviewer, notes: `Reviewed change from ${evidence}: ${decision.note}` } },
          },
        });
        entity = { type: "exam", id: c.examId };
        applied = { opensAt, closesAt, examDate, officialApplyUrl, previous: c.current };
        break;
      }

      case "STATUS_CHANGE": {
        const lifecycle = p.lifecycle as "CANCELLED" | "WITHDRAWN" | "SUPERSEDED";
        if (!["CANCELLED", "WITHDRAWN", "SUPERSEDED"].includes(lifecycle)) throw new ReviewError("Invalid lifecycle");
        const target = c.examId ? { type: "exam", id: c.examId } : c.schemeId ? { type: "scheme", id: c.schemeId } : null;
        if (!target) throw new ReviewError("Candidate is not linked to a listing");
        const data = { lifecycle, lifecycleNote: `${decision.note} (evidence: ${evidence})` };
        if (target.type === "exam") await tx.exam.update({ where: { id: target.id }, data });
        else await tx.scheme.update({ where: { id: target.id }, data });
        entity = target;
        applied = data;
        break;
      }

      default:
        // NOTICE_UPDATED, LINK_BROKEN, PARSER_FAILURE: acknowledgement only. Data changes go through the editor.
        applied = { acknowledged: true };
    }

    await tx.changeCandidate.update({ where: { id }, data: { state: "APPROVED", ...reviewed } });
    await writeAudit(
      {
        actor: reviewer,
        action: `review.approve.${c.kind.toLowerCase()}`,
        entityType: entity?.type ?? "change_candidate",
        entityId: entity?.id ?? id,
        changes: { candidate: id, evidence, note: decision.note, applied } as Prisma.InputJsonValue,
      },
      tx
    );
    return { state: "APPROVED" as const, entity };
  });
}
