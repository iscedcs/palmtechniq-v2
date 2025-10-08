import VerifyClient from "@/components/pages/courses/verify-course-payment/verify-client";

export default async function VerifyCoursePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference;
  return <VerifyClient reference={reference} />;
}
