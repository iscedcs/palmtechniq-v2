import { z } from "zod";

/**
 * Exam Center validators.
 *
 * These cover what can be checked from the payload alone. Anything that needs
 * the database — does the draw bank hold enough questions, does the roster have
 * anyone in it — is enforced in `validateExamForPublish` in actions/exam.ts.
 */

export const examScopeTypeSchema = z.enum([
  "COURSE",
  "PROGRAM_COHORT",
  "BOOTCAMP_TRACK",
  "AD_HOC",
]);

export const questionDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

export const examQuestionTypeSchema = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "CODE",
  "MULTI_SELECT",
  "MATCHING",
  "NUMERIC",
  "FILL_IN_BLANK",
]);

/** Question types a machine can mark. Everything else waits for a human. */
export const AUTO_GRADABLE_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MULTI_SELECT",
  "MATCHING",
  "NUMERIC",
  "FILL_IN_BLANK",
] as const;

export const SUBJECTIVE_TYPES = ["ESSAY", "CODE", "SHORT_ANSWER"] as const;

/**
 * Scope is a discriminated union so the id that matters is required and the
 * ones that don't are rejected — you cannot save an exam scoped to a course
 * while carrying a stale cohort id.
 */
export const examScopeSchema = z.discriminatedUnion("scopeType", [
  z.object({
    scopeType: z.literal("COURSE"),
    courseId: z.string().min(1, "Select a course"),
  }),
  z.object({
    scopeType: z.literal("PROGRAM_COHORT"),
    cohortId: z.string().min(1, "Select a cohort"),
  }),
  z.object({
    scopeType: z.literal("BOOTCAMP_TRACK"),
    trackId: z.string().min(1, "Select a bootcamp track"),
  }),
  z.object({
    scopeType: z.literal("AD_HOC"),
  }),
]);

export const examRulesSchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).default(1),
  passingScore: z.number().int().min(0).max(100).default(50),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  onePerPage: z.boolean().default(false),
  allowBacktrack: z.boolean().default(true),
});

export const examAccessSchema = z
  .object({
    accessMode: z
      .enum(["ROSTER_ONLY", "ACCESS_CODE", "MANUAL_RELEASE"])
      .default("ROSTER_ONLY"),
    accessCode: z.string().trim().min(4).max(32).optional().nullable(),
  })
  .refine(
    (v) => v.accessMode !== "ACCESS_CODE" || !!v.accessCode,
    // Publishing in ACCESS_CODE mode without a code would lock the whole roster out.
    { message: "An access code is required in access-code mode", path: ["accessCode"] },
  );

export const examResultsSchema = z.object({
  resultsPolicy: z.enum(["IMMEDIATE", "AFTER_CLOSE", "MANUAL"]).default("MANUAL"),
  showCorrectAnswers: z.boolean().default(false),
  showExplanations: z.boolean().default(false),
  isFinalAssessment: z.boolean().default(false),
});

/**
 * A schedule is optional on a draft and mandatory to publish, so it is validated
 * as its own unit rather than being folded into the create payload.
 */
export const examScheduleSchema = z
  .object({
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    durationMinutes: z.number().int().min(1).max(24 * 60),
    timezone: z.string().default("Africa/Lagos"),
  })
  .refine((v) => v.closesAt > v.opensAt, {
    message: "The exam must close after it opens",
    path: ["closesAt"],
  })
  .refine(
    (v) =>
      v.durationMinutes * 60_000 <= v.closesAt.getTime() - v.opensAt.getTime(),
    // Otherwise a candidate starting on time still cannot finish before the
    // window shuts, and would be auto-submitted mid-exam through no fault of theirs.
    {
      message: "The duration is longer than the window it has to run in",
      path: ["durationMinutes"],
    },
  );

export const createExamSchema = z.intersection(
  examScopeSchema,
  z.object({
    title: z.string().trim().min(3, "Give the exam a title").max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    instructions: z.string().trim().max(10_000).optional().nullable(),
  }),
);

export const updateExamSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  instructions: z.string().trim().max(10_000).nullable().optional(),
  opensAt: z.coerce.date().nullable().optional(),
  closesAt: z.coerce.date().nullable().optional(),
  durationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
  timezone: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  onePerPage: z.boolean().optional(),
  allowBacktrack: z.boolean().optional(),
  accessMode: z.enum(["ROSTER_ONLY", "ACCESS_CODE", "MANUAL_RELEASE"]).optional(),
  accessCode: z.string().trim().min(4).max(32).nullable().optional(),
  resultsPolicy: z.enum(["IMMEDIATE", "AFTER_CLOSE", "MANUAL"]).optional(),
  showCorrectAnswers: z.boolean().optional(),
  showExplanations: z.boolean().optional(),
  isFinalAssessment: z.boolean().optional(),
});

export const examSectionSchema = z
  .object({
    title: z.string().trim().min(1, "Give the section a title").max(200),
    instructions: z.string().trim().max(5000).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
    timeLimitMinutes: z.number().int().min(1).max(24 * 60).optional().nullable(),
    selectionMode: z.enum(["FIXED", "RANDOM_DRAW"]).default("FIXED"),
    drawBankId: z.string().optional().nullable(),
    drawCount: z.number().int().min(1).max(500).optional().nullable(),
    drawDifficulty: questionDifficultySchema.optional().nullable(),
    drawTopics: z.array(z.string().trim().min(1)).default([]),
    drawPoints: z.number().min(0).max(1000).optional().nullable(),
  })
  .refine((v) => v.drawCount == null || v.drawCount > 0, {
    message: "Draw at least one question",
    path: ["drawCount"],
  });

/*
 * Note there is deliberately NO rule here requiring a bank or a count when
 * selectionMode is RANDOM_DRAW.
 *
 * A tutor switches a section to "draw from a bank" BEFORE choosing the bank —
 * that is the natural order — and rejecting the switch left them with an error
 * toast and nowhere to go. An incomplete draw is a valid draft state; it is
 * `validateExamForPublish` that refuses to publish one, which is the point at
 * which it actually matters.
 */

export type ExamScopeInput = z.infer<typeof examScopeSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamSectionInput = z.infer<typeof examSectionSchema>;
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;
