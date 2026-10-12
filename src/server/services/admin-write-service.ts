import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { examCreateSchema, examUpdateSchema } from "@/validation/exam-schema";
import { schemeCreateSchema, schemeUpdateSchema } from "@/validation/scheme-schema";
import { diffFields, writeAudit } from "./audit";

type ExamCreate = z.output<typeof examCreateSchema>;
type ExamUpdate = z.output<typeof examUpdateSchema>;
type SchemeCreate = z.output<typeof schemeCreateSchema>;
type SchemeUpdate = z.output<typeof schemeUpdateSchema>;

/** Drops undefined keys so partial updates only touch provided fields. */
const defined = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

const verificationCreate = (actor: string, note?: string) =>
  note ? { create: { verifiedAt: new Date(), verifiedBy: actor, notes: note } } : undefined;

export const adminWriteService = {
  async createExam(data: ExamCreate, actor: string) {
    return db.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          name: data.name,
          slug: data.slug,
          conductingBodyId: data.conductingBodyId,
          department: data.department,
          educationEligibility: data.educationEligibility,
          ageEligibility: data.ageEligibility,
          stateId: data.stateId || null,
          examDate: data.examDate ?? null,
          admitCardDate: data.admitCardDate ?? null,
          resultStatus: data.resultStatus,
          applicationFee: data.applicationFee,
          vacancyCount: data.vacancyCount,
          officialApplyUrl: data.officialApplyUrl,
          applyLinkKind: data.applyLinkKind,
          lifecycle: data.lifecycle,
          lifecycleNote: data.lifecycleNote,
          // New records start as drafts; an admin publishes after review.
          isPublished: false,
          applicationPeriod: { create: { opensAt: data.opensAt ?? null, closesAt: data.closesAt ?? null } },
          sources: { create: data.sources.map((s) => ({ url: s.url, type: s.type, title: s.title })) },
          verifications: verificationCreate(actor, data.verificationNote),
        },
      });
      await writeAudit({ actor, action: "exam.create", entityType: "exam", entityId: exam.id, changes: { slug: exam.slug } }, tx);
      return exam;
    });
  },

  async updateExam(id: string, data: ExamUpdate, actor: string) {
    return db.$transaction(async (tx) => {
      const existing = await tx.exam.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: { applicationPeriod: true },
      });
      if (!existing) return null;

      const fields = defined({
        name: data.name,
        slug: data.slug,
        conductingBodyId: data.conductingBodyId,
        department: data.department,
        educationEligibility: data.educationEligibility,
        ageEligibility: data.ageEligibility,
        stateId: data.stateId === undefined ? undefined : data.stateId || null,
        examDate: data.examDate,
        admitCardDate: data.admitCardDate,
        resultStatus: data.resultStatus,
        applicationFee: data.applicationFee,
        vacancyCount: data.vacancyCount,
        officialApplyUrl: data.officialApplyUrl,
        applyLinkKind: data.applyLinkKind,
        lifecycle: data.lifecycle,
        lifecycleNote: data.lifecycleNote,
        isPublished: data.isPublished,
        isArchived: data.isArchived,
      });
      const period = defined({ opensAt: data.opensAt, closesAt: data.closesAt });

      const changes = {
        ...diffFields(existing, fields),
        ...diffFields({ opensAt: existing.applicationPeriod?.opensAt ?? null, closesAt: existing.applicationPeriod?.closesAt ?? null }, period),
      };

      const exam = await tx.exam.update({
        where: { id: existing.id },
        data: {
          ...(fields as Prisma.ExamUncheckedUpdateInput),
          applicationPeriod:
            Object.keys(period).length > 0
              ? { upsert: { create: { opensAt: period.opensAt ?? null, closesAt: period.closesAt ?? null }, update: period } }
              : undefined,
          verifications: verificationCreate(actor, data.verificationNote),
        },
      });
      if (Object.keys(changes).length > 0 || data.verificationNote) {
        await writeAudit(
          { actor, action: "exam.update", entityType: "exam", entityId: exam.id, changes: { ...changes, verified: data.verificationNote ?? undefined } },
          tx
        );
      }
      return exam;
    });
  },

  async createScheme(data: SchemeCreate, actor: string) {
    return db.$transaction(async (tx) => {
      const scheme = await tx.scheme.create({
        data: {
          name: data.name,
          slug: data.slug,
          departmentId: data.departmentId,
          whoCanBenefit: data.whoCanBenefit,
          eligibility: data.eligibility,
          benefits: data.benefits,
          requiredDocuments: data.requiredDocuments,
          applicationProcess: data.applicationProcess,
          programEndsAt: data.programEndsAt ?? null,
          stateId: data.stateId || null,
          officialApplyUrl: data.officialApplyUrl,
          applyLinkKind: data.applyLinkKind,
          lifecycle: data.lifecycle,
          lifecycleNote: data.lifecycleNote,
          // New records start as drafts; an admin publishes after review.
          isPublished: false,
          applicationPeriod: {
            create: { opensAt: data.opensAt ?? null, closesAt: data.closesAt ?? null, isRolling: data.isRolling ?? false },
          },
          sources: { create: data.sources.map((s) => ({ url: s.url, type: s.type, title: s.title })) },
          verifications: verificationCreate(actor, data.verificationNote),
        },
      });
      await writeAudit({ actor, action: "scheme.create", entityType: "scheme", entityId: scheme.id, changes: { slug: scheme.slug } }, tx);
      return scheme;
    });
  },

  async updateScheme(id: string, data: SchemeUpdate, actor: string) {
    return db.$transaction(async (tx) => {
      const existing = await tx.scheme.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: { applicationPeriod: true },
      });
      if (!existing) return null;

      const fields = defined({
        name: data.name,
        slug: data.slug,
        departmentId: data.departmentId,
        whoCanBenefit: data.whoCanBenefit,
        eligibility: data.eligibility,
        benefits: data.benefits,
        requiredDocuments: data.requiredDocuments,
        applicationProcess: data.applicationProcess,
        programEndsAt: data.programEndsAt,
        stateId: data.stateId === undefined ? undefined : data.stateId || null,
        officialApplyUrl: data.officialApplyUrl,
        applyLinkKind: data.applyLinkKind,
        lifecycle: data.lifecycle,
        lifecycleNote: data.lifecycleNote,
        isPublished: data.isPublished,
        isArchived: data.isArchived,
      });
      const period = defined({ opensAt: data.opensAt, closesAt: data.closesAt, isRolling: data.isRolling });
      const ap = existing.applicationPeriod;

      const changes = {
        ...diffFields(existing, fields),
        ...diffFields({ opensAt: ap?.opensAt ?? null, closesAt: ap?.closesAt ?? null, isRolling: ap?.isRolling ?? false }, period),
      };

      const scheme = await tx.scheme.update({
        where: { id: existing.id },
        data: {
          ...(fields as Prisma.SchemeUncheckedUpdateInput),
          applicationPeriod:
            Object.keys(period).length > 0
              ? {
                  upsert: {
                    create: { opensAt: period.opensAt ?? null, closesAt: period.closesAt ?? null, isRolling: period.isRolling ?? false },
                    update: period,
                  },
                }
              : undefined,
          verifications: verificationCreate(actor, data.verificationNote),
        },
      });
      if (Object.keys(changes).length > 0 || data.verificationNote) {
        await writeAudit(
          { actor, action: "scheme.update", entityType: "scheme", entityId: scheme.id, changes: { ...changes, verified: data.verificationNote ?? undefined } },
          tx
        );
      }
      return scheme;
    });
  },
};
