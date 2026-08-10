export const dynamic = "force-dynamic";

import { BankListClient } from "@/components/pages/tutor/question-banks/bank-list-client";
import { getTutorBanks } from "@/data/question-bank";

export const metadata = { title: "Question banks" };

export default async function QuestionBanksPage() {
  const banks = await getTutorBanks();

  return <BankListClient banks={banks} />;
}
