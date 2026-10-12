import { z } from "zod";
import { istDateField } from "./dates";

export const examQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  centralOnly: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  status: z.enum(["all", "open", "closing-soon", "upcoming", "closed"]).optional().default("all"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type ExamQueryParams = z.infer<typeof examQuerySchema>;

export const sourceInputSchema = z.object({
  url: z.string().url().startsWith("https://", "Official source URLs must use https"),
  type: z.enum(["OFFICIAL_NOTIFICATION", "OFFICIAL_GUIDELINE", "OFFICIAL_APPLICATION_PORTAL", "OTHER_OFFICIAL"]),
  title: z.string().optional(),
});

export const applyLinkKindSchema = z.enum(["DIRECT_APPLICATION", "APPLICATION_PORTAL", "DEPARTMENT_SITE"]);
export const lifecycleSchema = z.enum(["ACTIVE", "CANCELLED", "WITHDRAWN", "SUPERSEDED"]);

/** When set, the admin asserts they checked the record against the official source just now. */
export const verificationNoteSchema = z.string().trim().min(5, "Describe what you checked (min 5 characters)").optional();

const examFields = {
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  conductingBodyId: z.string().min(1, "Conducting body is required"),
  department: z.string().optional().nullable(),
  educationEligibility: z.string().min(3, "Education eligibility is required"),
  ageEligibility: z.string().min(3, "Age eligibility is required"),
  stateId: z.string().optional().nullable(),
  examDate: istDateField("start"),
  admitCardDate: istDateField("start"),
  resultStatus: z.string().optional().nullable(),
  applicationFee: z.string().optional().nullable(),
  vacancyCount: z.coerce.number().int().positive().optional().nullable(),
  officialApplyUrl: z.string().url("Official application URL must be a valid URL"),
  applyLinkKind: applyLinkKindSchema.optional(),
  lifecycle: lifecycleSchema.optional(),
  lifecycleNote: z.string().optional().nullable(),
  opensAt: istDateField("start"),
  closesAt: istDateField("end"),
  categoryIds: z.array(z.string()).default([]),
  sources: z.array(sourceInputSchema).min(1, "At least one official source is required"),
  verificationNote: verificationNoteSchema,
};

const closeAfterOpen = (d: { opensAt?: Date | null; closesAt?: Date | null }) =>
  !(d.opensAt && d.closesAt && d.closesAt.getTime() <= d.opensAt.getTime());
const closeAfterOpenMsg = { message: "Last date must be after the opening date", path: ["closesAt"] };

export const examCreateSchema = z.object(examFields).refine(closeAfterOpen, closeAfterOpenMsg);

export const examUpdateSchema = z
  .object(examFields)
  .partial()
  .extend({
    isPublished: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(closeAfterOpen, closeAfterOpenMsg);
