import { z } from "zod";

export const enrollmentSchema = z.object({
  // Step 1 — Program selection
  programSlug: z.string().min(1, "Please select a program"),

  // Step 2 — Personal details
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[0-9\s\-()]+$/, "Please enter a valid phone number"),
  dateOfBirth: z.string().optional(),
  highestQualification: z.string().optional(),

  // Step 3 — Program configuration
  cohortValue: z.string().min(1, "Please select a cohort"),
  learningMode: z.enum(["PHYSICAL", "VIRTUAL"], {
    message: "Please select a learning mode",
  }),

  // Step 4 — Payment plan
  paymentPlan: z.enum(["FULL_PAYMENT", "INSTALLMENT"], {
    message: "Please select a payment plan",
  }),

  // Step 5 — Confirmation
  agreeToTerms: z.literal(true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
