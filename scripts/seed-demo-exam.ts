/**
 * Seed a demo exam so the sitting screen can be exercised by hand.
 *
 * Attaches to an EXISTING account — it never creates a login. Pass the email of
 * an account you can already sign in as; that user is enrolled on a demo course
 * and rostered onto a published exam covering every question type.
 *
 * Run with:
 *   pnpm tsx scripts/seed-demo-exam.ts you@example.com
 *
 * Remove everything it created:
 *   pnpm tsx scripts/seed-demo-exam.ts --clean
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import { executePublish } from "@/lib/exam/publish";
import type { PrismaClient } from "@prisma/client";

const db = appDb as PrismaClient;

const MARKER = "[demo-exam]";
const COURSE_SLUG = "demo-exam-course";
const CATEGORY_SLUG = "demo-exam-category";

async function clean() {
  const course = await db.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (course) {
    await db.examEvent.deleteMany({ where: { exam: { courseId: course.id } } });
    await db.exam.deleteMany({ where: { courseId: course.id } });
    await db.enrollment.deleteMany({ where: { courseId: course.id } });
    await db.course.delete({ where: { id: course.id } });
  }
  await db.questionBank.deleteMany({ where: { title: { startsWith: MARKER } } });
  await db.tutor.deleteMany({ where: { title: { startsWith: MARKER } } });
  await db.category.deleteMany({ where: { slug: CATEGORY_SLUG } });
  console.log("Demo exam data removed.");
}

async function main() {
  const arg = process.argv[2];

  if (arg === "--clean") {
    await clean();
    return;
  }

  if (!arg) {
    console.error("Usage: pnpm tsx scripts/seed-demo-exam.ts <email-of-existing-account>");
    console.error("       pnpm tsx scripts/seed-demo-exam.ts --clean\n");
    const sample = await db.user.findMany({
      where: { role: { in: ["STUDENT", "USER"] } },
      select: { email: true, name: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    if (sample.length > 0) {
      console.error("Recent accounts you could use:");
      for (const u of sample) console.error(`  ${u.email}  (${u.name})`);
    }
    process.exitCode = 1;
    return;
  }

  const student = await db.user.findUnique({ where: { email: arg } });
  if (!student) {
    console.error(`No account found for ${arg}. This script does not create accounts.`);
    process.exitCode = 1;
    return;
  }

  // Start clean so re-running is predictable.
  await clean();

  // A tutor profile is needed to own the exam; reuse any existing one rather than
  // inventing a user.
  let tutor = await db.tutor.findFirst({ include: { user: true } });
  if (!tutor) {
    const tutorProfile = await db.tutor.create({
      data: { userId: student.id, title: `${MARKER} Demo Tutor`, experience: 1 },
      include: { user: true },
    });
    tutor = tutorProfile;
    console.log("No tutor existed, so the demo tutor profile was attached to this account.");
  }

  const category = await db.category.upsert({
    where: { slug: CATEGORY_SLUG },
    update: {},
    create: { name: `${MARKER} Demo`, slug: CATEGORY_SLUG },
  });

  const course = await db.course.create({
    data: {
      title: `${MARKER} Networking Fundamentals`,
      slug: COURSE_SLUG,
      description: "Demo course for the Exam Center.",
      subtitle: "Demo",
      price: 0,
      categoryId: category.id,
      creatorId: tutor.userId,
      tutorId: tutor.id,
    },
  });

  await db.enrollment.create({
    data: { userId: student.id, courseId: course.id, status: "ACTIVE" },
  });

  const now = Date.now();
  const exam = await db.exam.create({
    data: {
      title: "Networking Fundamentals — Midterm",
      description: "A demo exam covering every supported question type.",
      instructions:
        "Answer all questions. You may flag questions and return to them. " +
        "Your answers save automatically as you work.",
      scopeType: "COURSE",
      courseId: course.id,
      tutorId: tutor.id,
      opensAt: new Date(now - 60_000),
      closesAt: new Date(now + 7 * 24 * 60 * 60_000),
      durationMinutes: 45,
      passingScore: 50,
      maxAttempts: 3,
      shuffleQuestions: false,
      allowBacktrack: true,
      resultsPolicy: "IMMEDIATE",
    },
  });

  const section = await db.examSection.create({
    data: { examId: exam.id, title: "Section A", sortOrder: 0, selectionMode: "FIXED" },
  });

  const questions = [
    {
      stem: "Which statement about TCP is correct?",
      questionType: "MULTIPLE_CHOICE" as const,
      options: [
        "It is connectionless",
        "It guarantees ordered delivery",
        "It has no handshake",
        "It cannot retransmit",
      ],
      correctAnswer: "It guarantees ordered delivery",
      points: 10,
    },
    {
      stem: "UDP performs a three-way handshake before sending data.",
      questionType: "TRUE_FALSE" as const,
      options: null,
      correctAnswer: false,
      points: 5,
    },
    {
      stem: "Select every protocol that operates at the transport layer.",
      questionType: "MULTI_SELECT" as const,
      options: ["TCP", "UDP", "HTTP", "IP"],
      correctAnswer: ["TCP", "UDP"],
      points: 10,
    },
    {
      stem: "What is the default port for HTTPS?",
      questionType: "NUMERIC" as const,
      options: null,
      correctAnswer: 443,
      points: 5,
    },
    {
      stem: "The ____ layer of the OSI model is responsible for routing.",
      questionType: "FILL_IN_BLANK" as const,
      options: null,
      correctAnswer: ["network", "layer 3", "third"],
      points: 5,
    },
    {
      stem: "Match each protocol to its default port.",
      questionType: "MATCHING" as const,
      options: { left: ["HTTP", "SSH", "DNS"], right: ["22", "53", "80"] },
      correctAnswer: { HTTP: "80", SSH: "22", DNS: "53" },
      points: 15,
    },
    {
      stem: "Explain, in your own words, why TCP is preferred over UDP for file transfer.",
      questionType: "ESSAY" as const,
      options: null,
      correctAnswer: {},
      points: 20,
    },
  ];

  for (const [i, q] of questions.entries()) {
    await db.examQuestion.create({
      data: {
        examId: exam.id,
        sectionId: section.id,
        sortOrder: i,
        stem: q.stem,
        questionType: q.questionType,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer as never,
        points: q.points,
      },
    });
  }

  const published = await executePublish(exam.id, db);
  if (!published.ok) {
    console.error("Could not publish the demo exam:", published.error);
    process.exitCode = 1;
    return;
  }

  console.log(`\nDemo exam ready for ${student.email}`);
  console.log(`  questions:  ${questions.length}`);
  console.log(`  worth:      ${published.totalPoints} points`);
  console.log(`  roster:     ${published.candidateCount}`);
  console.log(`\n  Sign in as ${student.email}, then open:`);
  console.log(`    /student/exams`);
  console.log(`    /student/exams/${exam.id}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
