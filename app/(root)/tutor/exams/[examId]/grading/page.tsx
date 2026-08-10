export const dynamic = "force-dynamic";

import { ExamGradingClient } from "@/components/pages/tutor/exams/exam-grading-client";
import { getExamResults, getGradingQueue, getItemAnalysis } from "@/data/exam-grading";
import { getTutorExamDetail } from "@/data/tutor-exam";
import { notFound } from "next/navigation";

export default async function ExamGradingPage(props: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await props.params;

  // Returns null for someone else's exam, so this doubles as the auth check.
  const exam = await getTutorExamDetail(examId);
  if (!exam) return notFound();

  const [queue, results, itemAnalysis] = await Promise.all([
    getGradingQueue(examId),
    getExamResults(examId),
    getItemAnalysis(examId),
  ]);

  return (
    <ExamGradingClient
      examId={examId}
      examTitle={exam.title}
      isFinalAssessment={exam.isFinalAssessment}
      isCourseScoped={!!exam.courseId}
      queue={queue}
      results={results}
      itemAnalysis={itemAnalysis}
    />
  );
}
