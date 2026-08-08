import type { QuestionType } from "@prisma/client";

/**
 * Exam Center — question import parsers.
 *
 * Dependency-free on purpose. The obvious pick for spreadsheets, SheetJS/xlsx,
 * has a history of advisories and this repo already spends effort clearing
 * Trivy findings; a CSV parser is sixty lines and a known quantity. Tutors can
 * "Save as CSV" from Excel, so nothing is actually lost.
 *
 * Every parser returns the SAME shape and never throws. A malformed row becomes
 * a row carrying its own error, because the tutor has to be able to see and fix
 * the three bad rows rather than being told the file failed.
 */

export type ParsedQuestion = {
  stem: string;
  questionType: QuestionType;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  points: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
};

export type ParsedRow = {
  /** 1-based, and counts the header, so it matches what the tutor sees. */
  rowNumber: number;
  raw: string;
  question: Partial<ParsedQuestion>;
  errors: string[];
};

export type ImportFormat = "csv" | "paste" | "gift" | "aiken";

// ─── CSV ─────────────────────────────────────────────────────────────────────

/**
 * RFC 4180-ish CSV reader: quoted fields, escaped quotes (""), embedded commas
 * and newlines, and CRLF.
 */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const source = text.replace(/^﻿/, ""); // strip BOM — Excel loves adding one
  const delim = delimiter ?? detectDelimiter(source);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delim) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // handled by the \n that follows
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Pick the delimiter that appears most consistently in the header line. */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => ({
    d,
    n: firstLine.split(d).length - 1,
  }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ",";
}

const TYPE_ALIASES: Record<string, QuestionType> = {
  mcq: "MULTIPLE_CHOICE",
  multiplechoice: "MULTIPLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  single: "MULTIPLE_CHOICE",
  choice: "MULTIPLE_CHOICE",
  truefalse: "TRUE_FALSE",
  true_false: "TRUE_FALSE",
  tf: "TRUE_FALSE",
  boolean: "TRUE_FALSE",
  multiselect: "MULTI_SELECT",
  multi_select: "MULTI_SELECT",
  multiple_answer: "MULTI_SELECT",
  checkbox: "MULTI_SELECT",
  short: "SHORT_ANSWER",
  shortanswer: "SHORT_ANSWER",
  short_answer: "SHORT_ANSWER",
  essay: "ESSAY",
  longanswer: "ESSAY",
  code: "CODE",
  numeric: "NUMERIC",
  number: "NUMERIC",
  fill: "FILL_IN_BLANK",
  fillblank: "FILL_IN_BLANK",
  fill_in_blank: "FILL_IN_BLANK",
  cloze: "FILL_IN_BLANK",
  matching: "MATCHING",
  match: "MATCHING",
};

function normalizeType(value: string | undefined): QuestionType {
  if (!value?.trim()) return "MULTIPLE_CHOICE";
  const key = value.trim().toLowerCase().replace(/[\s-]/g, "_");
  return (
    TYPE_ALIASES[key] ??
    TYPE_ALIASES[key.replace(/_/g, "")] ??
    (key.toUpperCase() as QuestionType)
  );
}

function normalizeDifficulty(value: string | undefined): "EASY" | "MEDIUM" | "HARD" {
  const v = value?.trim().toLowerCase();
  if (v === "easy" || v === "1") return "EASY";
  if (v === "hard" || v === "3") return "HARD";
  return "MEDIUM";
}

/** Split a multi-value cell on | or ; or newline — whichever the tutor used. */
function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  const sep = value.includes("|") ? "|" : value.includes("\n") ? "\n" : ";";
  return value
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "A" / "a" / "1" -> index, for sheets that mark the answer by letter. */
function letterToIndex(token: string): number | null {
  const t = token.trim();
  if (/^[A-Za-z]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 65;
  if (/^\d+$/.test(t)) return Number(t) - 1;
  return null;
}

const HEADER_ALIASES: Record<string, string> = {
  question: "question",
  stem: "question",
  prompt: "question",
  text: "question",
  questiontext: "question",
  type: "type",
  questiontype: "type",
  kind: "type",
  options: "options",
  choices: "options",
  answers: "options",
  correct: "correct",
  correctanswer: "correct",
  answer: "correct",
  key: "correct",
  explanation: "explanation",
  rationale: "explanation",
  feedback: "explanation",
  points: "points",
  marks: "points",
  score: "points",
  difficulty: "difficulty",
  level: "difficulty",
  topics: "topics",
  topic: "topics",
  tags: "topics",
};

function canonicalHeader(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[\s_-]/g, "");
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  // option1..optionN / optiona..optionz / a..d
  const m = key.match(/^option([0-9]+|[a-z])$/);
  if (m) return `option:${m[1]}`;
  return key;
}

/**
 * Turn CSV rows into questions.
 *
 * Accommodates both shapes tutors actually have: one `options` column with
 * pipe-separated values, or separate `option1..optionN` / `optionA..` columns.
 */
export function parseCsvQuestions(text: string): ParsedRow[] {
  const rows = parseDelimited(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map(canonicalHeader);
  const optionCols = headers
    .map((h, i) => ({ h, i }))
    .filter((x) => x.h.startsWith("option:"))
    .map((x) => x.i);

  const out: ParsedRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };

    const errors: string[] = [];
    const stem = get("question");
    if (!stem) errors.push("No question text");

    const questionType = normalizeType(get("type"));

    let options: string[] = splitList(get("options"));
    if (options.length === 0 && optionCols.length > 0) {
      options = optionCols.map((i) => (cells[i] ?? "").trim()).filter(Boolean);
    }

    const correctRaw = get("correct");
    let correctAnswer: unknown = correctRaw;

    if (questionType === "TRUE_FALSE") {
      const v = correctRaw.toLowerCase();
      if (!v) errors.push("No correct answer");
      correctAnswer = v === "true" || v === "t" || v === "yes" || v === "1";
    } else if (questionType === "MULTI_SELECT") {
      const tokens = splitList(correctRaw).length
        ? splitList(correctRaw)
        : correctRaw.split(",").map((s) => s.trim()).filter(Boolean);
      correctAnswer = tokens.map((tok) => {
        const idx = letterToIndex(tok);
        return idx !== null && options[idx] !== undefined ? options[idx] : tok;
      });
      if ((correctAnswer as string[]).length === 0) errors.push("No correct answer");
    } else if (questionType === "NUMERIC") {
      const n = Number(correctRaw);
      if (!Number.isFinite(n)) errors.push(`"${correctRaw}" is not a number`);
      correctAnswer = n;
    } else if (questionType === "FILL_IN_BLANK") {
      const accepted = splitList(correctRaw).length
        ? splitList(correctRaw)
        : correctRaw.split(",").map((s) => s.trim()).filter(Boolean);
      if (accepted.length === 0) errors.push("No accepted answers");
      correctAnswer = accepted;
    } else if (questionType === "MULTIPLE_CHOICE") {
      if (!correctRaw) {
        errors.push("No correct answer");
      } else {
        // Accept the option text, or a letter/number pointing at it.
        const idx = letterToIndex(correctRaw);
        if (idx !== null && options[idx] !== undefined) {
          correctAnswer = options[idx];
        } else if (
          options.length > 0 &&
          !options.some((o) => o.toLowerCase() === correctRaw.toLowerCase())
        ) {
          errors.push(`Correct answer "${correctRaw}" is not one of the options`);
        }
      }
      if (options.length < 2) errors.push("Needs at least two options");
    }

    const pointsRaw = get("points");
    const points = pointsRaw ? Number(pointsRaw) : 1;
    if (pointsRaw && !Number.isFinite(points)) {
      errors.push(`"${pointsRaw}" is not a valid mark`);
    }

    out.push({
      rowNumber: r + 1,
      raw: cells.join(" | "),
      question: {
        stem,
        questionType,
        options: options.length > 0 ? options : null,
        correctAnswer,
        explanation: get("explanation") || null,
        points: Number.isFinite(points) ? points : 1,
        difficulty: normalizeDifficulty(get("difficulty")),
        topics: splitList(get("topics")),
      },
      errors,
    });
  }

  return out;
}

// ─── Aiken ───────────────────────────────────────────────────────────────────

/**
 * Aiken:
 *
 *   What is 2 + 2?
 *   A. Three
 *   B. Four
 *   ANSWER: B
 */
export function parseAiken(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const out: ParsedRow[] = [];

  let stem = "";
  let options: string[] = [];
  let startLine = 1;

  const flush = (answerLine: string | null, lineNo: number) => {
    if (!stem && options.length === 0) return;

    const errors: string[] = [];
    if (!stem) errors.push("No question text");
    if (options.length < 2) errors.push("Needs at least two options");

    let correct: unknown = null;
    if (!answerLine) {
      errors.push("No ANSWER line");
    } else {
      const token = answerLine.replace(/^ANSWER:/i, "").trim();
      const idx = letterToIndex(token);
      if (idx === null || options[idx] === undefined) {
        errors.push(`ANSWER "${token}" does not match any option`);
      } else {
        correct = options[idx];
      }
    }

    out.push({
      rowNumber: startLine,
      raw: [stem, ...options, answerLine ?? ""].join(" / "),
      question: {
        stem,
        questionType: "MULTIPLE_CHOICE",
        options: [...options],
        correctAnswer: correct,
        explanation: null,
        points: 1,
        difficulty: "MEDIUM",
        topics: [],
      },
      errors,
    });

    stem = "";
    options = [];
    startLine = lineNo + 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^ANSWER:/i.test(line)) {
      flush(line, i);
      continue;
    }

    const option = line.match(/^([A-Za-z])[.)]\s+(.*)$/);
    if (option && stem) {
      options.push(option[2].trim());
      continue;
    }

    if (!stem) {
      stem = line;
      startLine = i + 1;
    } else if (options.length === 0) {
      stem += ` ${line}`;
    }
  }
  flush(null, lines.length);

  return out.filter((r) => r.question.stem || r.errors.length > 0);
}

// ─── GIFT ────────────────────────────────────────────────────────────────────

/**
 * Moodle GIFT, the common subset:
 *
 *   ::Title:: Stem { =Right ~Wrong ~Wrong }
 *   Stem {T}
 *   Stem {#42:0.5}
 *   Stem {=one =uno}
 */
export function parseGift(text: string): ParsedRow[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("//"));

  return blocks.map((block, i) => {
    const errors: string[] = [];
    const withoutTitle = block.replace(/^::[^:]*::/, "").trim();
    const open = withoutTitle.indexOf("{");
    const close = withoutTitle.lastIndexOf("}");

    if (open === -1 || close === -1 || close < open) {
      return {
        rowNumber: i + 1,
        raw: block,
        question: { stem: withoutTitle },
        errors: ["Missing the { } answer block"],
      };
    }

    const stem = withoutTitle.slice(0, open).trim();
    const body = withoutTitle.slice(open + 1, close).trim();

    if (!stem) errors.push("No question text");

    let questionType: QuestionType = "MULTIPLE_CHOICE";
    let options: string[] | null = null;
    let correctAnswer: unknown = null;

    if (/^(T|TRUE|F|FALSE)$/i.test(body)) {
      questionType = "TRUE_FALSE";
      correctAnswer = /^(T|TRUE)$/i.test(body);
    } else if (body.startsWith("#")) {
      questionType = "NUMERIC";
      const spec = body.slice(1).trim();
      const [value, tolerance] = spec.split(":").map((s) => Number(s.trim()));
      if (!Number.isFinite(value)) {
        errors.push(`"${spec}" is not a number`);
      }
      correctAnswer = Number.isFinite(tolerance) ? { value, tolerance } : value;
    } else {
      // = correct, ~ wrong. Only "=" answers and no "~" means short answer.
      const tokens = body.match(/[=~][^=~]*/g) ?? [];
      const rights: string[] = [];
      const wrongs: string[] = [];

      for (const token of tokens) {
        // Strip any %50% weighting and #feedback GIFT allows.
        const value = token
          .slice(1)
          .replace(/^%-?\d+%/, "")
          .split("#")[0]
          .trim();
        if (!value) continue;
        if (token.startsWith("=")) rights.push(value);
        else wrongs.push(value);
      }

      if (rights.length === 0) {
        errors.push("No correct answer marked with =");
      }

      if (wrongs.length === 0) {
        questionType = "FILL_IN_BLANK";
        correctAnswer = rights;
      } else {
        questionType = "MULTIPLE_CHOICE";
        options = [...rights, ...wrongs];
        correctAnswer = rights[0] ?? null;
        if (options.length < 2) errors.push("Needs at least two options");
      }
    }

    return {
      rowNumber: i + 1,
      raw: block,
      question: {
        stem,
        questionType,
        options,
        correctAnswer,
        explanation: null,
        points: 1,
        difficulty: "MEDIUM" as const,
        topics: [],
      },
      errors,
    };
  });
}

// ─── Auto-detect ─────────────────────────────────────────────────────────────

/**
 * Work out what the tutor actually pasted.
 *
 * They will paste whatever their old tool exported without telling us which
 * format it is, so guessing well matters more than being strict.
 */
export function detectFormat(text: string): ImportFormat {
  const sample = text.trim();
  if (/^ANSWER:/im.test(sample)) return "aiken";
  if (/\{[^}]*[=~#][^}]*\}/.test(sample) || /^::/m.test(sample)) return "gift";

  const firstLine = sample.split(/\r?\n/, 1)[0] ?? "";
  if (/(,|;|\t)/.test(firstLine) && /question|stem|prompt/i.test(firstLine)) {
    return "csv";
  }
  if (/(,|;|\t)/.test(firstLine)) return "csv";
  return "paste";
}

/**
 * Newline-separated plain questions with no structure at all — the "I just have
 * a list of questions" case. Everything imports as an essay for the tutor to
 * classify, which beats rejecting the paste.
 */
export function parsePlainList(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => ({
      rowNumber: i + 1,
      raw: line,
      question: {
        stem: line.replace(/^\d+[.)]\s*/, ""),
        questionType: "ESSAY" as QuestionType,
        options: null,
        correctAnswer: {},
        explanation: null,
        points: 1,
        difficulty: "MEDIUM" as const,
        topics: [],
      },
      errors: [] as string[],
    }));
}

/** Parse using an explicit format, or auto-detect. */
export function parseQuestions(
  text: string,
  format?: ImportFormat,
): { format: ImportFormat; rows: ParsedRow[] } {
  const chosen = format ?? detectFormat(text);
  switch (chosen) {
    case "aiken":
      return { format: chosen, rows: parseAiken(text) };
    case "gift":
      return { format: chosen, rows: parseGift(text) };
    case "csv":
      return { format: chosen, rows: parseCsvQuestions(text) };
    default:
      return { format: "paste", rows: parsePlainList(text) };
  }
}

/** The downloadable CSV template. */
export const CSV_TEMPLATE = [
  "question,type,options,correct,explanation,points,difficulty,topics",
  '"Which protocol guarantees ordered delivery?",multiple_choice,"TCP|UDP|ICMP|ARP",TCP,"TCP is connection-oriented.",10,medium,"networking|transport"',
  '"UDP performs a handshake before sending data.",true_false,,false,,5,easy,networking',
  '"Select every transport-layer protocol.",multi_select,"TCP|UDP|HTTP|IP","TCP|UDP",,10,medium,networking',
  '"What is the default port for HTTPS?",numeric,,443,,5,easy,networking',
  '"The ____ layer is responsible for routing.",fill_in_blank,,"network|layer 3",,5,medium,osi',
  '"Explain why TCP suits file transfer.",essay,,,,20,hard,networking',
].join("\n");
