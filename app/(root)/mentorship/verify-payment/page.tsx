import MentorshipVerifyClient from "@/components/pages/mentorship/verify-payment/verify-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Payment Verification",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyMentorshipPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  let reference = (await searchParams).reference;
  // Handle case where reference might be an array (duplicate query params)
  if (Array.isArray(reference)) {
    reference = reference[0];
  }
  return <MentorshipVerifyClient reference={reference} />;
}
