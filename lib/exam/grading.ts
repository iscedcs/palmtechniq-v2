import type { QuestionType } from "@prisma/client";

/**
 * Exam Center — objective scoring.
 *
 * Pure functions, no database. Everything here answers one question: given a
 * stored correct answer and what the candidate submitted, is it right?
 *
 * Anything a machine cannot fairly judge returns `requiresManual` and waits for a
 * human. Guessing at an essay is worse than admitting we cannot mark it.
 */

/** Types a machine marks. Everything else goes to the grading queue. */
export const AUTO_GRADED_TYPES: QuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MULTI_SELECT",
  "MATCHING",
  "NUMERIC",
  "FILL_IN_BLANK",
];

export function isAutoGraded(type: QuestionType): boolean {
  return AUTO_GRADED_TYPES.includes(type);
}

export type ScoreOutcome = {
  /** null when a human still has to decide. */
  isCorrect: boolean | null;
  /** Points awarded, or null when pending manual marking. */
  score: number | null;
  requiresManual: boolean;
};

/** Trim, collapse inner whitespace, casefold. Used for text comparison only. */
function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/** Set equality ignoring order and duplicates. */
function sameSet(a: unknown[], b: unknown[]): boolean {
  const left = new Set(a.map(normalizeText));
  const right = new Set(b.map(normalizeText));
  if (left.size !== right.size) return false;
  for (const item of left) if (!right.has(item)) return false;
  return true;
}

/**
 * Numeric answers may be stored either bare (`42`) or with a tolerance
 * (`{ value: 42, tolerance: 0.5 }`), which is what makes physics and finance
 * questions markable at all.
 */
function scoreNumeric(correct: unknown, answer: unknown): boolean {
  const submitted = Number(
    typeof answer === "string" ? answer.trim().replace(/,/g, "") : answer,
  );
  if (!Number.isFinite(submitted)) return false;

  if (correct !== null && typeof correct === "object" && "value" in (correct as object)) {
    const spec = correct as { value: unknown; tolerance?: unknown };
    const target = Number(spec.value);
    const tolerance = Math.abs(Number(spec.tolerance ?? 0));
    if (!Number.isFinite(target)) return false;
    return Math.abs(submitted - target) <= tolerance;
  }

  const target = Number(correct);
  if (!Number.isFinite(target)) return false;
  // Epsilon rather than === so 0.1 + 0.2 does not fail a candidate.
  return Math.abs(submitted - target) < 1e-9;
}

/**
 * Matching questions compare pair-by-pair: `{ left: right }`. Order is
 * irrelevant, every pair must agree, and a missing pair is wrong.
 */
function scoreMatching(correct: unknown, answer: unknown): boolean {
  if (
    correct === null ||
    typeof correct !== "object" ||
    Array.isArray(correct) ||
    answer === null ||
    typeof answer !== "object" ||
    Array.isArray(answer)
  ) {
    return false;
  }

  const expected = correct as Record<string, unknown>;
  const submitted = answer as Record<string, unknown>;

  const expectedKeys = Object.keys(expected);
  if (expectedKeys.length !== Object.keys(submitted).length) return false;

  return expectedKeys.every(
    (key) =>
      key in submitted && normalizeText(expected[key]) === normalizeText(submitted[key]),
  );
}

/**
 * Score one response.
 *
 * `answer` is whatever the candidate saved — it may be null (unanswered), and an
 * unanswered objective question scores zero rather than erroring.
 */
export function scoreResponse(
  question: { questionType: QuestionType; correctAnswer: unknown; points: number },
  answer: unknown,
): ScoreOutcome {
  if (!isAutoGraded(question.questionType)) {
    return { isCorrect: null, score: null, requiresManual: true };
  }

  const unanswered =
    answer === null ||
    answer === undefined ||
    (typeof answer === "string" && answer.trim() === "") ||
    (Array.isArray(answer) && answer.length === 0);

  if (unanswered) {
    return { isCorrect: false, score: 0, requiresManual: false };
  }

  let correct = false;

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      correct = normalizeText(question.correctAnswer) === normalizeText(answer);
      break;

    case "TRUE_FALSE": {
      // Tolerate "true"/true/"TRUE" on both sides — the client may send either.
      const toBool = (v: unknown) =>
        typeof v === "boolean" ? v : normalizeText(v) === "true";
      correct = toBool(question.correctAnswer) === toBool(answer);
      break;
    }

    case "MULTI_SELECT":
      correct = sameSet(asArray(question.correctAnswer), asArray(answer));
      break;

    case "MATCHING":
      correct = scoreMatching(question.correctAnswer, answer);
      break;

    case "NUMERIC":
      correct = scoreNumeric(question.correctAnswer, answer);
      break;

    case "FILL_IN_BLANK": {
      // A stored array means several wordings are acceptable.
      const accepted = asArray(question.correctAnswer).map(normalizeText);
      correct = accepted.includes(normalizeText(answer));
      break;
    }

    default:
      return { isCorrect: null, score: null, requiresManual: true };
  }

  return {
    isCorrect: correct,
    score: correct ? question.points : 0,
    requiresManual: false,
  };
}

/**
 * Deterministic per-attempt option shuffle.
 *
 * Derived from the attempt and question ids rather than stored, so the order is
 * stable across reloads and resumes without needing a column to keep it in — and
 * two candidates still see different orders.
 */
export function shuffledOptionOrder(
  attemptId: string,
  questionId: string,
  length: number,
): number[] {
  const order = Array.from({ length }, (_, i) => i);

  // FNV-1a over the two ids, used to seed a small xorshift PRNG.
  let seed = 2166136261;
  const key = `${attemptId}:${questionId}`;
  for (let i = 0; i < key.length; i++) {
    seed ^= key.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  seed >>>= 0;
  if (seed === 0) seed = 0x9e3779b9;

  const next = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0x100000000;
  };

  // Fisher–Yates.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
}
