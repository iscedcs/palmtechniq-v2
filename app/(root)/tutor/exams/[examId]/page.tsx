export const dynamic = "force-dynamic";

import { ExamEditorClient } from "@/components/pages/tutor/exams/exam-editor-client";
import { getTutorExamDetail } from "@/data/tutor-exam";
import { notFound } from "next/navigation";

export default async function TutorExamEditorPage(props: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await props.params;

  // Returns null for someone else's exam too, so an unauthorised id is
  // indistinguishable from a missing one.
  const exam = await getTutorExamDetail(examId);
  if (!exam) return notFound();

  return <ExamEditorClient exam={exam} />;
}
