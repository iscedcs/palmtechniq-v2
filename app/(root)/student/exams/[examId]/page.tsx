export const dynamic = "force-dynamic";

import { ExamBriefingClient } from "@/components/pages/student/exams/exam-briefing-client";
import { getExamBriefing } from "@/data/exam";
import { notFound } from "next/navigation";

export default async function ExamBriefingPage(props: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { examId } = await props.params;
  const { submitted } = await props.searchParams;

  const briefing = await getExamBriefing(examId);

  // Also covers "not on the roster" — an exam you cannot sit should not confirm
  // that it exists.
  if (!briefing) return notFound();

  return (
    <ExamBriefingClient briefing={briefing} justSubmitted={submitted === "1"} />
  );
}
