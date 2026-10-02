import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().optional().default("admin"),
  secretKey: z.string().min(1, "Password or secret key is required"),
});

export const verificationActionSchema = z.object({
  examId: z.string().optional(),
  schemeId: z.string().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().min(1, "Verification notes or confirmation details required"),
});

export const adminStatusActionSchema = z.object({
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
