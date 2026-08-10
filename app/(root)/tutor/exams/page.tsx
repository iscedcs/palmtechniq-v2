export const dynamic = "force-dynamic";

import { TutorExamListClient } from "@/components/pages/tutor/exams/tutor-exam-list-client";
import { getTutorExams } from "@/data/tutor-exam";

export const metadata = { title: "Exams" };

export default async function TutorExamsPage() {
  const exams = await getTutorExams();

  return <TutorExamListClient exams={exams} />;
}
