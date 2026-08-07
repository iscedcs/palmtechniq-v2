/**
 * Verification script for Exam Center manual grading and results release.
 *
 * Covers the parts that are painful to get wrong after the fact: marking limits,
 * release only touching fully-marked papers, certificate issuance being
 * idempotent, revocation when an override drops someone below the pass mark, and
 * the audit trail actually being written.
 *
 * Self-contained fixture, torn down in a `finally`. Does NOT touch existing data.
 *
 * Run with:
 *   pnpm tsx scripts/verify-exam-results.ts
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import { saveResponse, startAttempt, submitAttempt } from "@/lib/exam/attempt";
import { executePublish } from "@/lib/exam/publish";
import { applyManualScore, overrideGrade, releaseExamResults } from "@/lib/exam/results";
import { ExamSubmittedBy, type PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = appDb as PrismaClient;

const RUN = randomUUID().slice(0, 8);
const tag = (s: string) => `[results-verify-${RUN}] ${s}`;
const email = (s: string) => `results-verify-${RUN}-${s}@invalid.test`;

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

async function main() {
  console.log(`\nExam results verification (run ${RUN})\n`);

  const tutorUser = await db.user.create({
    data: { email: email("tutor"), name: tag("Tutor"), role: "TUTOR" },
  });
  const tutor = await db.tutor.create({
    data: { userId: tutorUser.id, title: tag("Tutor"), experience: 1 },
  });
  const category = await db.category.create({
    data: { name: tag("Cat"), slug: `results-verify-${RUN}` },
  });
  const course = await db.course.create({
    data: {
      title: tag("Course"),
      slug: `results-verify-course-${RUN}`,
      description: "fixture",
      subtitle: "fixture",
      price: 0,
      categoryId: category.id,
      creatorId: tutorUser.id,
      tutorId: tutor.id,
    },
  });

  // Two students: one will pass, one will fail.
  const [alice, bob] = await Promise.all([
    db.user.create({ data: { email: email("alice"), name: tag("Alice"), role: "STUDENT" } }),
    db.user.create({ data: { email: email("bob"), name: tag("Bob"), role: "STUDENT" } }),
  ]);
  await db.enrollment.createMany({
    data: [
      { userId: alice.id, courseId: course.id, status: "ACTIVE" },
      { userId: bob.id, courseId: course.id, status: "ACTIVE" },
    ],
  });

  const now = Date.now();
  const exam = await db.exam.create({
    data: {
      title: tag("Final"),
      scopeType: "COURSE",
      courseId: course.id,
      tutorId: tutor.id,
      opensAt: new Date(now - 60_000),
      closesAt: new Date(now + 24 * 60 * 60_000),
      durationMinutes: 60,
      passingScore: 50,
      maxAttempts: 1,
      isFinalAssessment: true, // so release should issue certificates
    },
  });

  const section = await db.examSection.create({
    data: { examId: exam.id, title: "A", sortOrder: 0, selectionMode: "FIXED" },
  });

  const mcq = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 0,
      stem: tag("mcq"),
      questionType: "MULTIPLE_CHOICE",
      options: ["a", "b"],
      correctAnswer: "b",
      points: 50,
    },
  });
  const essay = await db.examQuestion.create({
    data: {
      examId: exam.id,
      sectionId: section.id,
      sortOrder: 1,
      stem: tag("essay"),
      questionType: "ESSAY",
      correctAnswer: {},
      points: 50,
    },
  });

  try {
    const published = await executePublish(exam.id, db);
    if (!published.ok) {
      check("fixture publishes", false, published.error);
      return;
    }

    // Both sit it. Alice answers the MCQ correctly, Bob does not.
    const aliceAttempt = await startAttempt(exam.id, alice.id, {}, db);
    const bobAttempt = await startAttempt(exam.id, bob.id, {}, db);
    if (!aliceAttempt.ok || !bobAttempt.ok) {
      check("both candidates start", false);
      return;
    }

    await saveResponse(aliceAttempt.attemptId, alice.id, mcq.id, "b", {}, db);
    await saveResponse(aliceAttempt.attemptId, alice.id, essay.id, "Alice's essay.", {}, db);
    await saveResponse(bobAttempt.attemptId, bob.id, mcq.id, "a", {}, db);
    await saveResponse(bobAttempt.attemptId, bob.id, essay.id, "Bob's essay.", {}, db);

    await submitAttempt(aliceAttempt.attemptId, ExamSubmittedBy.STUDENT, db);
    await submitAttempt(bobAttempt.attemptId, ExamSubmittedBy.STUDENT, db);

    // ─── Pending state ───────────────────────────────────────────────────────
    console.log("Pending marking");

    const aliceGrade0 = await db.examGrade.findUniqueOrThrow({
      where: { attemptId: aliceAttempt.attemptId },
    });
    check(
      "an essay leaves the grade PENDING_MANUAL",
      aliceGrade0.status === "PENDING_MANUAL",
      aliceGrade0.status,
    );
    check(
      "the objective half is already scored",
      aliceGrade0.autoScore === 50,
      `got ${aliceGrade0.autoScore}`,
    );

    const earlyRelease = await releaseExamResults(exam.id, tutorUser.id, db);
    check(
      "releasing with everything unmarked releases nothing",
      earlyRelease.ok && earlyRelease.released === 0,
      earlyRelease.ok ? `released ${earlyRelease.released}` : earlyRelease.error,
    );

    // ─── Marking ─────────────────────────────────────────────────────────────
    console.log("\nMarking");

    const aliceEssay = await db.examResponse.findFirstOrThrow({
      where: { attemptId: aliceAttempt.attemptId, questionId: essay.id },
    });
    const bobEssay = await db.examResponse.findFirstOrThrow({
      where: { attemptId: bobAttempt.attemptId, questionId: essay.id },
    });

    const tooHigh = await applyManualScore(aliceEssay.id, 500, tutorUser.id, null, db);
    check(
      "a mark above the question's points is refused",
      !tooHigh.ok,
      tooHigh.ok ? "it was accepted" : tooHigh.error,
    );

    const negative = await applyManualScore(aliceEssay.id, -5, tutorUser.id, null, db);
    check("a negative mark is refused", !negative.ok);

    const autoAttempt = await db.examResponse.findFirstOrThrow({
      where: { attemptId: aliceAttempt.attemptId, questionId: mcq.id },
    });
    const notManual = await applyManualScore(autoAttempt.id, 10, tutorUser.id, null, db);
    check(
      "an auto-marked question cannot be marked by hand",
      !notManual.ok,
      notManual.ok ? "it was accepted" : notManual.error,
    );

    // Alice: 50 (mcq) + 40 (essay) = 90 → pass. Bob: 0 + 10 = 10 → fail.
    const marked = await applyManualScore(aliceEssay.id, 40, tutorUser.id, "Good work", db);
    check("a valid mark is accepted", marked.ok, !marked.ok ? marked.error : "");
    await applyManualScore(bobEssay.id, 10, tutorUser.id, "Needs more depth", db);

    const aliceGrade1 = await db.examGrade.findUniqueOrThrow({
      where: { attemptId: aliceAttempt.attemptId },
    });
    check("marking moves the grade to GRADED", aliceGrade1.status === "GRADED", aliceGrade1.status);
    check("the total combines auto and manual", aliceGrade1.totalScore === 90, `got ${aliceGrade1.totalScore}`);
    check("passed is set once nothing is outstanding", aliceGrade1.passed === true);

    const bobGrade1 = await db.examGrade.findUniqueOrThrow({
      where: { attemptId: bobAttempt.attemptId },
    });
    check("a failing total is not marked passed", bobGrade1.passed === false, `${bobGrade1.totalScore}`);

    const markAudits = await db.examGradeAudit.count({ where: { gradeId: aliceGrade1.id } });
    check("marking is audited", markAudits >= 1, `${markAudits} rows`);

    // ─── Release and certificates ────────────────────────────────────────────
    console.log("\nRelease");

    const release = await releaseExamResults(exam.id, tutorUser.id, db);
    check("release succeeds", release.ok, !release.ok ? release.error : "");
    if (!release.ok) return;

    check("both results are released", release.released === 2, `got ${release.released}`);
    check(
      "one certificate is issued, for the passing candidate only",
      release.certificatesIssued === 1,
      `got ${release.certificatesIssued}`,
    );

    const certs = await db.certificate.findMany({ where: { courseId: course.id } });
    check("the certificate belongs to the student who passed", certs.length === 1 && certs[0].userId === alice.id);
    check("the certificate is not revoked", certs[0]?.isRevoked === false);

    const aliceGrade2 = await db.examGrade.findUniqueOrThrow({
      where: { attemptId: aliceAttempt.attemptId },
    });
    check("the grade links to its certificate", aliceGrade2.certificateId === certs[0]?.id);
    check("the grade is RELEASED", aliceGrade2.status === "RELEASED", aliceGrade2.status);

    const examAfter = await db.exam.findUniqueOrThrow({ where: { id: exam.id } });
    check("the exam moves to RELEASED", examAfter.status === "RELEASED", examAfter.status);

    // ─── Idempotency ─────────────────────────────────────────────────────────
    console.log("\nIdempotency");

    const secondRelease = await releaseExamResults(exam.id, tutorUser.id, db);
    check(
      "releasing again releases nothing further",
      secondRelease.ok && secondRelease.released === 0,
      secondRelease.ok ? `released ${secondRelease.released}` : secondRelease.error,
    );

    const certsAfter = await db.certificate.count({ where: { courseId: course.id } });
    check("no duplicate certificate is minted", certsAfter === 1, `got ${certsAfter}`);

    // ─── Override and revocation ─────────────────────────────────────────────
    console.log("\nOverride");

    const noReason = await overrideGrade(aliceGrade2.id, 20, "", tutorUser.id, db);
    check("an override without a reason is refused", !noReason.ok);

    const outOfRange = await overrideGrade(aliceGrade2.id, 999, "typo", tutorUser.id, db);
    check("an override above the maximum is refused", !outOfRange.ok);

    const dropped = await overrideGrade(
      aliceGrade2.id,
      20,
      "Plagiarism found in the essay",
      tutorUser.id,
      db,
    );
    check("a valid override succeeds", dropped.ok, !dropped.ok ? dropped.error : "");
    check("the override marks the result as failed", dropped.ok && dropped.passed === false);

    const revoked = await db.certificate.findUniqueOrThrow({ where: { id: certs[0].id } });
    check(
      "dropping below the pass mark revokes the certificate",
      revoked.isRevoked === true,
    );
    check(
      "the certificate is revoked, not deleted",
      (await db.certificate.count({ where: { id: certs[0].id } })) === 1,
    );

    const restored = await overrideGrade(
      aliceGrade2.id,
      90,
      "Appeal upheld",
      tutorUser.id,
      db,
    );
    check("the score can be restored", restored.ok && restored.passed === true);

    const unrevoked = await db.certificate.findUniqueOrThrow({ where: { id: certs[0].id } });
    check("restoring the score un-revokes the certificate", unrevoked.isRevoked === false);

    const auditRows = await db.examGradeAudit.findMany({
      where: { gradeId: aliceGrade2.id },
      orderBy: { createdAt: "asc" },
    });
    check(
      "every change is on the audit trail",
      auditRows.length >= 5,
      `${auditRows.length} rows: ${auditRows.map((a) => a.field).join(", ")}`,
    );
    check(
      "the override reason is recorded",
      auditRows.some((a) => a.reason === "Plagiarism found in the essay"),
    );
    check(
      "revocation is recorded with who did it",
      auditRows.some((a) => a.field === "certificate.isRevoked" && a.changedById === tutorUser.id),
    );

    // ─── Non-course-scoped final ─────────────────────────────────────────────
    console.log("\nNon-course-scoped final");

    const adHoc = await db.exam.create({
      data: {
        title: tag("Ad-hoc final"),
        scopeType: "AD_HOC",
        tutorId: tutor.id,
        opensAt: new Date(now - 60_000),
        closesAt: new Date(now + 24 * 60 * 60_000),
        durationMinutes: 30,
        passingScore: 50,
        isFinalAssessment: true,
      },
    });
    const adHocSection = await db.examSection.create({
      data: { examId: adHoc.id, title: "A", sortOrder: 0, selectionMode: "FIXED" },
    });
    const adHocQ = await db.examQuestion.create({
      data: {
        examId: adHoc.id,
        sectionId: adHocSection.id,
        sortOrder: 0,
        stem: tag("q"),
        questionType: "TRUE_FALSE",
        correctAnswer: true,
        points: 10,
      },
    });
    await db.examCandidate.create({
      data: { examId: adHoc.id, userId: alice.id, addedManually: true },
    });
    await executePublish(adHoc.id, db);

    const adHocAttempt = await startAttempt(adHoc.id, alice.id, {}, db);
    if (adHocAttempt.ok) {
      await saveResponse(adHocAttempt.attemptId, alice.id, adHocQ.id, true, {}, db);
      await submitAttempt(adHocAttempt.attemptId, ExamSubmittedBy.STUDENT, db);
    }

    const adHocRelease = await releaseExamResults(adHoc.id, tutorUser.id, db);
    check(
      "a non-course-scoped final still releases its results",
      adHocRelease.ok && adHocRelease.released === 1,
      adHocRelease.ok ? `${adHocRelease.released}` : adHocRelease.error,
    );
    check(
      "but issues no certificate, and says why",
      adHocRelease.ok &&
        adHocRelease.certificatesIssued === 0 &&
        !!adHocRelease.certificateNote,
      adHocRelease.ok ? adHocRelease.certificateNote ?? "no note" : "",
    );
  } finally {
    await db.examGradeAudit.deleteMany({ where: { grade: { exam: { tutorId: tutor.id } } } });
    await db.examEvent.deleteMany({ where: { exam: { tutorId: tutor.id } } });
    await db.certificate.deleteMany({ where: { courseId: course.id } });
    await db.exam.deleteMany({ where: { tutorId: tutor.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.deleteMany({ where: { id: course.id } });
    await db.category.deleteMany({ where: { id: category.id } });
    await db.tutor.deleteMany({ where: { id: tutor.id } });
    await db.user.deleteMany({ where: { email: { startsWith: `results-verify-${RUN}-` } } });

    console.log(`\n${passed} passed, ${failed} failed\n`);
  }

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
