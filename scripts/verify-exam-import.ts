/**
 * Verification script for the Exam Center import pipeline.
 *
 * Most of this is pure parsing, so most of it needs no database. The DB section
 * covers commit, de-duplication and rollback against a disposable fixture.
 *
 * Run with:
 *   pnpm verify:exam-import
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import {
  commitImport,
  exportBankAsCsv,
  previewImport,
  rollbackImport,
  validateQuestion,
} from "@/lib/exam/import/pipeline";
import {
  CSV_TEMPLATE,
  detectFormat,
  parseDelimited,
  parseQuestions,
} from "@/lib/exam/import/parsers";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[import-verify-${RUN}] ${s}`;

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function verifyParsers() {
  console.log("CSV reader");

  const quoted = parseDelimited('a,b,c\n"has, comma","has ""quotes""",plain');
  check("splits a plain header", quoted[0].join("|") === "a|b|c");
  check("respects quoted commas", quoted[1][0] === "has, comma", quoted[1][0]);
  check("unescapes doubled quotes", quoted[1][1] === 'has "quotes"', quoted[1][1]);

  const embedded = parseDelimited('q,a\n"line one\nline two",x');
  check("keeps newlines inside quotes", embedded[1][0] === "line one\nline two");

  check(
    "handles semicolon-delimited exports",
    parseDelimited("a;b;c\n1;2;3")[1].join("|") === "1|2|3",
  );
  check("strips a BOM", parseDelimited("﻿a,b\n1,2")[0][0] === "a");

  console.log("\nCSV questions");

  const csv = previewImport(CSV_TEMPLATE, "csv");
  check("the shipped template parses cleanly", csv.invalidRows === 0, JSON.stringify(csv.rows.filter((r) => !r.valid).map((r) => r.errors)));
  check("the template yields six questions", csv.totalRows === 6, `got ${csv.totalRows}`);

  const mc = csv.rows[0].question;
  check("options split on the pipe", Array.isArray(mc.options) && (mc.options as string[]).length === 4);
  check("true/false becomes a boolean", csv.rows[1].question.correctAnswer === false);
  check(
    "multi-select answers become an array",
    Array.isArray(csv.rows[2].question.correctAnswer) &&
      (csv.rows[2].question.correctAnswer as string[]).length === 2,
  );
  check("numeric answers become numbers", csv.rows[3].question.correctAnswer === 443);
  check(
    "fill-in-the-blank keeps every accepted wording",
    Array.isArray(csv.rows[4].question.correctAnswer) &&
      (csv.rows[4].question.correctAnswer as string[]).includes("layer 3"),
  );
  check("topics split into an array", (csv.rows[0].question.topics ?? []).length === 2);

  // Letter answers and per-option columns — what real spreadsheets look like.
  const lettered = previewImport(
    ["question,type,option1,option2,option3,correct", "Pick one,mcq,Alpha,Beta,Gamma,B"].join("\n"),
    "csv",
  );
  check(
    "answers given as a letter resolve to the option",
    lettered.rows[0].question.correctAnswer === "Beta",
    String(lettered.rows[0].question.correctAnswer),
  );
  check("option columns are collected", (lettered.rows[0].question.options as string[]).length === 3);

  console.log("\nBad rows survive as errors");

  const messy = previewImport(
    [
      "question,type,options,correct",
      '"Good one",mcq,"A|B",A',
      ',mcq,"A|B",A',
      '"Answer not in options",mcq,"A|B",Z',
      '"Only one option",mcq,"A",A',
      '"Bad number",numeric,,abc',
    ].join("\n"),
    "csv",
  );
  check("a valid row stays valid", messy.rows[0].valid);
  check("a missing question is caught", !messy.rows[1].valid && messy.rows[1].errors.some((e) => /question text/i.test(e)));
  check(
    "an answer that is not an option is caught",
    !messy.rows[2].valid && messy.rows[2].errors.some((e) => /not one of the options/i.test(e)),
  );
  check("too few options is caught", !messy.rows[3].valid);
  check("a non-numeric numeric answer is caught", !messy.rows[4].valid);
  check("good and bad rows are reported together", messy.validRows === 1 && messy.invalidRows === 4);
  check("bad rows keep their row number", messy.rows[1].rowNumber === 3, String(messy.rows[1].rowNumber));
  check("bad rows keep their original text", messy.rows[2].raw.includes("Answer not in options"));

  console.log("\nAiken");

  const aiken = previewImport(
    [
      "What is 2 + 2?",
      "A. Three",
      "B. Four",
      "ANSWER: B",
      "",
      "Capital of Nigeria?",
      "A. Lagos",
      "B. Abuja",
      "ANSWER: B",
    ].join("\n"),
    "aiken",
  );
  check("two Aiken questions parse", aiken.totalRows === 2, `got ${aiken.totalRows}`);
  check("the ANSWER letter resolves", aiken.rows[0].question.correctAnswer === "Four");
  check("all Aiken rows are valid", aiken.invalidRows === 0, JSON.stringify(aiken.rows.map((r) => r.errors)));

  const aikenBad = previewImport(["No answer line?", "A. One", "B. Two"].join("\n"), "aiken");
  check("a missing ANSWER line is caught", aikenBad.rows[0].errors.some((e) => /ANSWER/i.test(e)));

  console.log("\nGIFT");

  const gift = previewImport(
    [
      "::Capital:: What is the capital of Nigeria? {=Abuja ~Lagos ~Kano}",
      "",
      "The sky is blue. {T}",
      "",
      "What is 6 x 7? {#42:0.5}",
      "",
      "One plus one is {=two =2}",
    ].join("\n"),
    "gift",
  );
  check("four GIFT blocks parse", gift.totalRows === 4, `got ${gift.totalRows}`);
  check("the title prefix is stripped", !String(gift.rows[0].question.stem).includes("::"));
  check("= marks the correct option", gift.rows[0].question.correctAnswer === "Abuja");
  check("{T} becomes true/false", gift.rows[1].question.questionType === "TRUE_FALSE" && gift.rows[1].question.correctAnswer === true);
  check(
    "numeric tolerance is kept",
    JSON.stringify(gift.rows[2].question.correctAnswer) === JSON.stringify({ value: 42, tolerance: 0.5 }),
    JSON.stringify(gift.rows[2].question.correctAnswer),
  );
  check(
    "= only, no ~, becomes fill-in-the-blank",
    gift.rows[3].question.questionType === "FILL_IN_BLANK",
    String(gift.rows[3].question.questionType),
  );
  check("all GIFT rows are valid", gift.invalidRows === 0, JSON.stringify(gift.rows.map((r) => r.errors)));

  console.log("\nFormat detection");
  check("detects Aiken", detectFormat("Q?\nA. one\nB. two\nANSWER: A") === "aiken");
  check("detects GIFT", detectFormat("Stem {=right ~wrong}") === "gift");
  check("detects CSV", detectFormat("question,type,correct\na,b,c") === "csv");
  check("falls back to a plain list", detectFormat("Just one question?\nAnd another?") === "paste");

  const plain = parseQuestions("What is recursion?\n2. Explain closures.");
  check("a plain list still imports", plain.rows.length === 2);
  check("list numbering is stripped", plain.rows[1].question.stem === "Explain closures.", String(plain.rows[1].question.stem));

  console.log("\nReal-world type labels");
  // Every one of these came out of a tutor's actual export, which is where the
  // parser met them for the first time.
  const labels = previewImport(
    [
      "question,type,options,correct",
      '"Slash separated",True/False,,true',
      '"Compound label","Short Answer / Scenario",,',
      '"Hyphenated",Multiple-Choice,"A|B",A',
      '"Title case","Multiple Choice","A|B",A',
      '"Nonsense type",Blancmange,,x',
    ].join("\n"),
    "csv",
  );
  check(
    '"True/False" resolves rather than being split in two',
    labels.rows[0].question.questionType === "TRUE_FALSE",
    String(labels.rows[0].question.questionType),
  );
  check(
    "a compound label takes the first type it recognises",
    labels.rows[1].question.questionType === "SHORT_ANSWER",
    String(labels.rows[1].question.questionType),
  );
  check(
    "hyphenated and title-case labels resolve",
    labels.rows[2].question.questionType === "MULTIPLE_CHOICE" &&
      labels.rows[3].question.questionType === "MULTIPLE_CHOICE",
  );
  check(
    "an unrecognised type is rejected, not passed through as a bad enum",
    !labels.rows[4].valid &&
      labels.rows[4].errors.some((e) => /not a question type/i.test(e)),
    JSON.stringify(labels.rows[4].errors),
  );

  console.log("\nSection becomes a topic");
  const sectioned = previewImport(
    [
      "question,section,type,options,correct",
      '"Q","Section A - OWASP",mcq,"A|B",A',
    ].join("\n"),
    "csv",
  );
  check(
    "a Section column is imported as a topic",
    (sectioned.rows[0].question.topics ?? []).includes("Section A - OWASP"),
    JSON.stringify(sectioned.rows[0].question.topics),
  );

  console.log("\nValidation guards");
  check(
    "an essay needs no answer",
    validateQuestion({ stem: "Discuss.", questionType: "ESSAY", points: 10 }).length === 0,
  );
  check(
    "negative marks are rejected",
    validateQuestion({ stem: "x", questionType: "ESSAY", points: -5 }).some((e) => /zero or more/i.test(e)),
  );
}

async function verifyDatabase() {
  console.log("\nCommit, de-duplication and rollback");

  const tutorUser = await db.user.create({
    data: { email: `import-verify-${RUN}@invalid.test`, name: tag("Tutor"), role: "TUTOR" },
  });
  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });
  const bank = await db.questionBank.create({
    data: { title: tag("Bank"), ownerId: tutor.id },
  });

  try {
    const preview = previewImport(CSV_TEMPLATE, "csv");
    const valid = preview.rows.filter((r) => r.valid).map((r) => r.question);

    const first = await commitImport(
      bank.id,
      valid,
      { importedById: tutorUser.id, sourceFormat: "csv", sourceName: "template.csv", totalRows: preview.totalRows },
      db,
    );
    check("a clean import commits", first.ok, first.ok ? "" : first.error);
    if (!first.ok) return;
    check("every valid row is imported", first.imported === 6, `got ${first.imported}`);

    const stored = await db.bankQuestion.count({ where: { bankId: bank.id } });
    check("the bank holds them", stored === 6, `got ${stored}`);

    const batch = await db.questionImportBatch.findUniqueOrThrow({ where: { id: first.batchId } });
    check("the batch records provenance", batch.sourceName === "template.csv" && batch.importedById === tutorUser.id);

    // Same file twice must not double the bank.
    const second = await commitImport(
      bank.id,
      valid,
      { importedById: tutorUser.id, sourceFormat: "csv", totalRows: preview.totalRows },
      db,
    );
    check("re-importing the same file imports nothing", second.ok && second.imported === 0, second.ok ? `imported ${second.imported}` : second.error);
    check("and reports them as duplicates", second.ok && second.duplicates === 6, second.ok ? `${second.duplicates}` : "");
    check("the bank is unchanged", (await db.bankQuestion.count({ where: { bankId: bank.id } })) === 6);

    // Invalid rows are recorded on the batch rather than silently dropped.
    const mixed = await commitImport(
      bank.id,
      [
        { stem: "A brand new question", questionType: "ESSAY", points: 5, difficulty: "MEDIUM", topics: [] },
        { stem: "", questionType: "ESSAY", points: 5, difficulty: "MEDIUM", topics: [] },
      ],
      { importedById: tutorUser.id, sourceFormat: "paste", totalRows: 2 },
      db,
    );
    check("a mixed import takes the good row", mixed.ok && mixed.imported === 1, mixed.ok ? `${mixed.imported}` : mixed.error);
    check("and records the bad one", mixed.ok && mixed.skipped === 1);

    // Export round-trips.
    const csv = await exportBankAsCsv(bank.id, db);
    const reimported = previewImport(csv, "csv");
    check(
      "an exported bank re-imports cleanly",
      reimported.invalidRows === 0,
      JSON.stringify(reimported.rows.filter((r) => !r.valid).map((r) => r.errors)),
    );

    // Rollback removes only what no exam has snapshotted.
    const rolled = await rollbackImport(first.batchId, db);
    check("rollback removes the batch's questions", rolled.ok && rolled.removed === 6, rolled.ok ? `${rolled.removed}` : rolled.error);
    check("the other import survives", (await db.bankQuestion.count({ where: { bankId: bank.id } })) === 1);
  } finally {
    await db.bankQuestion.deleteMany({ where: { bankId: bank.id } });
    await db.questionImportBatch.deleteMany({ where: { bankId: bank.id } });
    await db.questionBank.deleteMany({ where: { id: bank.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({ where: { id: tutorUser.id } });
  }
}

async function main() {
  console.log(`\nExam import verification (run ${RUN})\n`);
  verifyParsers();
  await verifyDatabase();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
