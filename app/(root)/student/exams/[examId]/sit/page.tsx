export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { ExamRunnerClient } from "@/components/pages/student/exams/exam-runner-client";
import { db } from "@/lib/db";
import { getAttemptPaper } from "@/lib/exam/attempt";
import { ExamAttemptStatus, type PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = db as PrismaClient;

/**
 * The exam runner.
 *
 * This page never starts an attempt — starting is a deliberate action taken on
 * the briefing page, so a stray navigation or a prefetch can never begin someone's
 * exam. Landing here without a running attempt sends you back.
 */
export default async function SitExamPage(props: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await props.params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const attempt = await prisma.examAttempt.findFirst({
    where: {
      examId,
      userId: session.user.id,
      status: ExamAttemptStatus.IN_PROGRESS,
      isPractice: false,
    },
    orderBy: { attemptNumber: "desc" },
    select: { id: true, expiresAt: true },
  });

  if (!attempt) redirect(`/student/exams/${examId}`);

  // Time ran out while they were away: let the briefing page report the outcome
  // rather than opening a paper that cannot be submitted.
  if (attempt.expiresAt <= new Date()) redirect(`/student/exams/${examId}`);

  const paper = await getAttemptPaper(attempt.id, session.user.id, prisma);
  if (!paper.ok) redirect(`/student/exams/${examId}`);

  const exam = await prisma.exam.findUniqueOrThrow({
    where: { id: examId },
    select: { title: true, onePerPage: true, allowBacktrack: true },
  });

  return (
    <ExamRunnerClient
      examId={examId}
      examTitle={exam.title}
      attemptId={paper.attemptId}
      expiresAt={paper.expiresAt.toISOString()}
      serverTime={paper.serverTime.toISOString()}
      questions={paper.questions}
      onePerPage={exam.onePerPage}
      allowBacktrack={exam.allowBacktrack}
    />
  );
}
