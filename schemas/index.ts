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
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  );

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
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

// Base course schema for publishing (strict validation)
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
  // Use .nullish() for nullable database fields (accepts both null and undefined)
  basePrice: z.number().min(0, "Base price must be non-negative").nullish(),
  currentPrice: z
    .number()
    .min(0, "Current price must be non-negative")
    .nullish(),
  currency: z.string().min(1, "Currency is required"),
  thumbnail: z.string().min(1, "Thumbnail is required"),
  previewVideo: z.string().nullish(),
  tags: z.array(z.string()),
  requirements: z.array(z.string().min(1, "Requirement cannot be empty")),
  outcomes: z.array(z.string().min(1, "Learning outcome cannot be empty")),
  duration: z.preprocess(
    (val) => (val !== "" && val !== null ? Number(val) : undefined),
    z.number().min(0, "Duration must be non-negative").nullish(),
  ) as unknown as z.ZodNullable<z.ZodOptional<z.ZodNumber>>,

  totalLessons: z
    .number()
    .min(0, "Total lessons must be non-negative")
    .nullish(),
  isPublished: z.boolean(),
  allowDiscussions: z.boolean(),
  certificate: z.boolean().nullish(),
  isFlashSale: z.boolean(),
  flashSaleEnd: z.preprocess(
    (val) =>
      typeof val === "string" ? new Date(val).toISOString() : undefined,
    z.string().datetime().nullish(),
  ) as unknown as z.ZodNullable<z.ZodOptional<z.ZodString>>,
  groupBuyingEnabled: z.boolean(),
  groupBuyingDiscount: z.number().min(0).max(1).nullish(),
  groupTiers: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.number().int().min(2, "Group size must be at least 2"),
        groupPrice: z.number().min(0, "Group price must be non-negative"),
        cashbackPercent: z.number().min(0).max(1).default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .default([]),
  targetAudience: z
    .array(z.string().min(1, "Audience entry cannot be empty"))
    .nullish(),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
});

// Draft course schema (relaxed validation for saving drafts)
export const courseDraftSchema = courseSchema.extend({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().default(""),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  thumbnail: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
});

export const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  content: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be non-negative"),
  duration: z.number().min(0, "Duration must be non-negative"),
  isPublished: z.boolean().default(false),
});

export const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  lessonType: z
    .enum(["VIDEO", "TEXT", "QUIZ", "PROJECT", "LIVE"])
    .default("VIDEO"),
  duration: z.number().min(0, "Duration must be non-negative"),
  content: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  sortOrder: z.number().min(0, "Order must be non-negative"),
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
  // Use .nullish() for nullable database fields (accepts both null and undefined)
  basePrice: z.number().min(0).nullish(),
  currentPrice: z.number().min(0).nullish(),
  currency: z.string().min(1),
  thumbnail: z.string().nullish(),
  previewVideo: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  requirements: z.array(z.string().min(1)).nullish(),
  learningOutcomes: z.array(z.string().min(1)).nullish(),
  duration: z.number().min(0).nullish(),
  totalLessons: z.number().min(0).nullish(),

  // Advanced fields (edit-only)
  isPublished: z.boolean().nullish(),
  allowDiscussions: z.boolean().nullish(),
  certificateEnabled: z.boolean().nullish(),
  isFlashSale: z.boolean().nullish(),
  flashSaleEnd: z.string().datetime().nullish(),
  groupBuyingEnabled: z.boolean().nullish(),
  groupBuyingDiscount: z.number().min(0).max(1).nullish(),
  groupTiers: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.number().int().min(2, "Group size must be at least 2"),
        groupPrice: z.number().min(0, "Group price must be non-negative"),
        cashbackPercent: z.number().min(0).max(1).optional().default(0),
        isActive: z.boolean().optional().default(true),
      }),
    )
    .nullish(),
  certificate: z.boolean().nullish(),

  // 🔹 Extra fields for edit
  targetAudience: z.array(z.string()).nullish(),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  demandLevel: z.enum(["low", "medium", "high"]).nullish(),
});

// Resource schema for projects
export const projectResourceSchema = z.object({
  title: z.string().min(1, "Resource title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").min(1, "Resource URL is required"),
  type: z.enum(["PDF", "VIDEO", "AUDIO", "IMAGE", "LINK", "CODE", "DOCUMENT"], {
    message: "Invalid resource type",
  }),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z
    .array(z.string().min(1, "Requirement cannot be empty"))
    .min(1, "At least one requirement is required"),
  points: z.number().int().min(1, "Points must be at least 1").default(100),
  isActive: z.boolean().default(true),
  courseId: z.string().min(1, "Course is required"),
  moduleId: z.string().min(1, "Module is required"),
  dueDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional(),
  ),
  submissionType: z.enum(["FILE", "GITHUB", "LINK", "TEXT", "QUIZ"], {
    message: "Invalid submission type",
  }),
  resources: z.array(projectResourceSchema).optional().default([]),
});

// Project schemas
export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z
    .array(z.string().min(1, "Requirement cannot be empty"))
    .min(1, "At least one requirement is required"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    message: "Invalid difficulty level",
  }),
  points: z.number().int().min(1, "Points must be at least 1").default(100),
  isActive: z.boolean().default(true),
  courseId: z.string().min(1, "Course is required"),
  resources: z.array(projectResourceSchema).optional().default([]),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  feedback: z.string().min(1, "Feedback is required"),
});

export const gradeTaskSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  feedback: z.string().min(1, "Feedback is required"),
});

export const reviewSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, "Review must be at least 3 characters"),
});

export const updateReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, "Review must be at least 3 characters"),
});

const optionalUrlSchema = z
  .union([z.string().url("Must be a valid URL"), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const studentSubmissionSchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),
    githubUrl: optionalUrlSchema,
    liveUrl: optionalUrlSchema,
    notes: z.string().optional(),
    fileUrl: optionalUrlSchema,
  })
  .refine(
    (data) =>
      Boolean(data.githubUrl || data.liveUrl || data.notes || data.fileUrl),
    {
      message: "Provide at least one of GitHub URL, Live URL, notes, or a file",
      path: ["githubUrl"],
    },
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>;
export type StudentSubmissionFormData = z.infer<typeof studentSubmissionSchema>;
