export const dynamic = "force-dynamic";

import { ExamMonitorClient } from "@/components/pages/tutor/exams/exam-monitor-client";
import { getExamMonitor } from "@/data/exam-monitor";
import { notFound } from "next/navigation";

export default async function ExamMonitorPage(props: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await props.params;

  // Null covers both "no such exam" and "not yours".
  const snapshot = await getExamMonitor(examId);
  if (!snapshot) return notFound();

  return <ExamMonitorClient snapshot={snapshot} />;
}
