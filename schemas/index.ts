import { z } from "zod";

// Base schemas
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@₦!%*?&])[A-Za-z\d@₦!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s]+₦/, "Name can only contain letters and spaces");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}₦/, "Please enter a valid phone number")
  .min(10, "Phone number must be at least 10 digits");

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    message: "Invalid level",
  }),
  language: z.string().min(1, "Language is required"),
  price: z.number().min(0, "Price must be non-negative"),
  basePrice: z.number().min(0, "Base price must be non-negative").optional(),
  currentPrice: z
    .number()
    .min(0, "Current price must be non-negative")
    .optional(),
  currency: z.string().min(1, "Currency is required"),
  thumbnail: z.string().min(1, "Thumbnail is required"),
  previewVideo: z.string().optional(),
  tags: z.array(z.string()),
  requirements: z.array(z.string().min(1, "Requirement cannot be empty")),
  outcomes: z.array(z.string().min(1, "Learning outcome cannot be empty")),
  duration: z.preprocess(
    (val) => (val !== "" ? Number(val) : undefined),
    z.number().min(0, "Duration must be non-negative").optional()
  ) as unknown as z.ZodOptional<z.ZodNumber>,

  totalLessons: z
    .number()
    .min(0, "Total lessons must be non-negative")
    .optional(),
  isPublished: z.boolean(),
  allowDiscussions: z.boolean(),
  certificate: z.boolean().optional(),
  isFlashSale: z.boolean(),
  flashSaleEnd: z.preprocess(
    (val) =>
      typeof val === "string" ? new Date(val).toISOString() : undefined,
    z.string().datetime().optional()
  ) as unknown as z.ZodOptional<z.ZodString>,
  groupBuyingEnabled: z.boolean(),
  groupBuyingDiscount: z.number().min(0).max(1).optional(),
  targetAudience: z
    .array(z.string().min(1, "Audience entry cannot be empty"))
    .optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  content: z.string().nullable().optional(),
  description: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be non-negative"),
  duration: z.number().min(0, "Duration must be non-negative"),
  isPublished: z.boolean().default(false),
});

export const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  lessonType: z.enum(["VIDEO", "TEXT", "QUIZ", "PROJECT", "LIVE"]),
  duration: z.number().min(0, "Duration must be non-negative"),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be non-negative"),
  description: z.string().optional(),
  isPreview: z.boolean().default(false),
});

export const updateCourseSchema = z.object({
  id: z.string().min(1, "Course ID is required"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  language: z.string().min(1, "Language is required"),
  price: z.number().min(0),
  basePrice: z.number().min(0).optional(),
  currentPrice: z.number().min(0).optional(),
  currency: z.string().min(1),
  thumbnail: z.string().optional(),
  previewVideo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string().min(1)).optional(),
  learningOutcomes: z.array(z.string().min(1)).optional(),
  duration: z.number().min(0).optional(),
  totalLessons: z.number().min(0).optional(),

  // Advanced fields (edit-only)
  isPublished: z.boolean().optional(),
  allowDiscussions: z.boolean().optional(),
  certificateEnabled: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
  flashSaleEnd: z.string().datetime().optional(),
  groupBuyingEnabled: z.boolean().optional(),
  groupBuyingDiscount: z.number().min(0).max(1).optional(),
  certificate: z.boolean().optional(),

  // 🔹 Extra fields for edit
  targetAudience: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  demandLevel: z.enum(["low", "medium", "high"]).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
