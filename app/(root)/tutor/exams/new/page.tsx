export const dynamic = "force-dynamic";

import { NewExamClient } from "@/components/pages/tutor/exams/new-exam-client";
import { getExamScopeOptions } from "@/data/tutor-exam";

export const metadata = { title: "New exam" };

export default async function NewExamPage() {
  const options = await getExamScopeOptions();

  return <NewExamClient options={options} />;
}
