export const dynamic = "force-dynamic";

import { ExamEditorClient } from "@/components/pages/tutor/exams/exam-editor-client";
import { countDrawPool } from "@/data/question-bank";
import { getAvailableBanks, getTutorExamDetail } from "@/data/tutor-exam";
import { notFound } from "next/navigation";

export default async function TutorExamEditorPage(props: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await props.params;

  // Returns null for someone else's exam too, so an unauthorised id is
  // indistinguishable from a missing one.
  const exam = await getTutorExamDetail(examId);
  if (!exam) return notFound();

  const banks = await getAvailableBanks();

  // How many bank questions each drawing section currently matches, so the
  // editor can warn about an impossible draw before publish rather than at it.
  const drawing = exam.sections.filter(
    (s) => s.selectionMode === "RANDOM_DRAW" && s.drawBankId,
  );
  const counts = await Promise.all(
    drawing.map(async (s) => [
      s.id,
      await countDrawPool({
        bankId: s.drawBankId!,
        difficulty: s.drawDifficulty,
        topics: s.drawTopics,
      }),
    ] as const),
  );

  return (
    <ExamEditorClient
      exam={exam}
      banks={banks}
      poolCounts={Object.fromEntries(counts)}
    />
  );
}
