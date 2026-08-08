export const dynamic = "force-dynamic";

import { BankDetailClient } from "@/components/pages/tutor/question-banks/bank-detail-client";
import { getBankDetail } from "@/data/question-bank";
import { notFound } from "next/navigation";

export default async function QuestionBankPage(props: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await props.params;

  // Null covers "no such bank" and "not shared with you" alike.
  const bank = await getBankDetail(bankId);
  if (!bank) return notFound();

  return <BankDetailClient bank={bank} />;
}
