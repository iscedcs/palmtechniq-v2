export const dynamic = "force-dynamic";

import { ExamListClient } from "@/components/pages/student/exams/exam-list-client";
import { getStudentExams } from "@/data/exam";

export const metadata = {
  title: "Exams",
};

export default async function StudentExamsPage() {
  const exams = await getStudentExams();

  return <ExamListClient exams={exams} />;
}
