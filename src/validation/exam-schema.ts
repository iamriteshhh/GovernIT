import { z } from "zod";

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

export const examCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  conductingBodyId: z.string().min(1, "Conducting body is required"),
  department: z.string().optional().nullable(),
  educationEligibility: z.string().min(3, "Education eligibility is required"),
  ageEligibility: z.string().min(3, "Age eligibility is required"),
  stateId: z.string().optional().nullable(),
  examDate: z.string().datetime().optional().nullable(),
  admitCardDate: z.string().datetime().optional().nullable(),
  resultStatus: z.string().optional().nullable(),
  applicationFee: z.string().optional().nullable(),
  vacancyCount: z.coerce.number().int().positive().optional().nullable(),
  officialApplyUrl: z.string().url("Official application URL must be a valid URL"),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  sources: z.array(
    z.object({
      url: z.string().url(),
      type: z.enum([
        "OFFICIAL_NOTIFICATION",
        "OFFICIAL_GUIDELINE",
        "OFFICIAL_APPLICATION_PORTAL",
        "OTHER_OFFICIAL",
      ]),
      title: z.string().optional(),
    })
  ).min(1, "At least one official source is required"),
});
