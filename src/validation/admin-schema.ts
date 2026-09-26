import { z } from "zod";

export const adminLoginSchema = z.object({
  secretKey: z.string().min(1, "Secret key / password is required"),
});

export const verificationActionSchema = z.object({
  examId: z.string().optional(),
  schemeId: z.string().optional(),
  verifiedBy: z.string().default("editorial_admin"),
  notes: z.string().min(1, "Verification notes or confirmation details required"),
});
