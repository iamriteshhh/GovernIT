import { z } from "zod";
import { istDateField } from "./dates";
import { applyLinkKindSchema, lifecycleSchema, sourceInputSchema, verificationNoteSchema } from "./exam-schema";

export const schemeQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  centralOnly: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  status: z.enum(["all", "open", "closing-soon", "closed"]).optional().default("all"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type SchemeQueryParams = z.infer<typeof schemeQuerySchema>;

const schemeFields = {
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  departmentId: z.string().min(1, "Department is required"),
  whoCanBenefit: z.string().min(5, "Who can benefit description is required"),
  eligibility: z.string().min(5, "Eligibility criteria description is required"),
  benefits: z.string().min(5, "Benefits summary is required"),
  requiredDocuments: z.string().min(5, "Required documents list is required"),
  applicationProcess: z.string().min(5, "Application process details are required"),
  /** Canonical application window (stored in ApplicationPeriod). */
  opensAt: istDateField("start"),
  closesAt: istDateField("end"),
  isRolling: z.boolean().optional(),
  /** End of the scheme itself, never used as an application deadline. */
  programEndsAt: istDateField("end"),
  stateId: z.string().optional().nullable(),
  officialApplyUrl: z.string().url("Must be a valid official URL"),
  applyLinkKind: applyLinkKindSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  lifecycleNote: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  sources: z.array(sourceInputSchema).min(1, "At least one official source is required"),
  verificationNote: verificationNoteSchema,
};

const consistentWindow = (d: { opensAt?: Date | null; closesAt?: Date | null; isRolling?: boolean }) =>
  !(d.opensAt && d.closesAt && d.closesAt.getTime() <= d.opensAt.getTime()) && !(d.isRolling && d.closesAt);
const windowMsg = {
  message: "Last date must be after the opening date, and a rolling scheme cannot have a last date",
  path: ["closesAt"],
};

export const schemeCreateSchema = z.object(schemeFields).refine(consistentWindow, windowMsg);

export const schemeUpdateSchema = z
  .object(schemeFields)
  .partial()
  .extend({
    isPublished: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(consistentWindow, windowMsg);
