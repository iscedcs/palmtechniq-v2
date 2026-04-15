import VerifyClient from "@/components/pages/courses/verify-course-payment/verify-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Verification",
  robots: { index: false, follow: false },
};

export default async function VerifyCoursePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference;
  return <VerifyClient reference={reference} />;
}
