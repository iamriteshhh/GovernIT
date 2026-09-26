import { z } from "zod";

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

export const schemeCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  departmentId: z.string().min(1, "Department is required"),
  whoCanBenefit: z.string().min(5, "Who can benefit description is required"),
  eligibility: z.string().min(5, "Eligibility criteria description is required"),
  benefits: z.string().min(5, "Benefits summary is required"),
  requiredDocuments: z.string().min(5, "Required documents list is required"),
  applicationProcess: z.string().min(5, "Application process details are required"),
  deadline: z.string().datetime().optional().nullable(),
  stateId: z.string().optional().nullable(),
  officialApplyUrl: z.string().url("Must be a valid official URL"),
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
