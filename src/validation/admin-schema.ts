import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().optional().default("admin"),
  secretKey: z.string().min(1, "Password or secret key is required"),
});

export const verificationActionSchema = z
  .object({
    examId: z.string().optional(),
    schemeId: z.string().optional(),
    notes: z.string().trim().min(5, "Describe what you checked on the official source"),
  })
  .refine((d) => Boolean(d.examId) !== Boolean(d.schemeId), { message: "Provide exactly one of examId or schemeId" });

export const reviewActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().min(3, "Add a short review note"),
  /** Optional corrections applied instead of the proposed values (ISO or IST date input). */
  corrections: z
    .object({
      opensAt: z.string().nullable().optional(),
      closesAt: z.string().nullable().optional(),
      examDate: z.string().nullable().optional(),
      officialApplyUrl: z.string().url().optional(),
    })
    .optional(),
});

export const adminStatusActionSchema = z.object({
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
