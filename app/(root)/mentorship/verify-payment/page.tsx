import MentorshipVerifyClient from "@/components/pages/mentorship/verify-payment/verify-client";

export const dynamic = "force-dynamic";

export default async function VerifyMentorshipPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference;
  return <MentorshipVerifyClient reference={reference} />;
}
