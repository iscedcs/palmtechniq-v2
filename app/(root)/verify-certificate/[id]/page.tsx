import { redirect } from "next/navigation";

interface VerifyCertificateRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCertificateIdRedirectPage({
  params,
}: VerifyCertificateRedirectProps) {
  const { id } = await params;
  redirect(`/verify-certificate?code=${encodeURIComponent(id)}`);
}
