import { z } from "zod";

export const programPaymentLinkItemSchema = z.object({
  programSlug: z.string().min(1, "Please select a program"),
  cohortValue: z.string().min(1, "Please select a cohort"),
});

export const createProgramPaymentLinkSchema = z.object({
  studentName: z
    .string()
    .min(2, "Student name must be at least 2 characters")
    .max(100, "Student name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]*$/, "Please enter a valid phone number")
    .optional(),
  note: z.string().max(500, "Note must be under 500 characters").optional(),
  // Whole-naira negotiated total; the parts allocated per program are Ints too.
  amount: z
    .number()
    .int("Amount must be a whole naira value (no kobo)")
    .positive("Amount must be positive"),
  expiresAt: z.string().optional(),
  learningMode: z.enum(["PHYSICAL", "VIRTUAL"]).default("VIRTUAL"),
  items: z
    .array(programPaymentLinkItemSchema)
    .min(1, "Select at least one program"),
});

export type CreateProgramPaymentLinkInput = z.infer<
  typeof createProgramPaymentLinkSchema
>;
