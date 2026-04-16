import { redirect } from "next/navigation";

interface CertificateRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function CertificateRedirectPage({
  params,
}: CertificateRedirectProps) {
  const { id } = await params;
  redirect(`/verify-certificate?code=${encodeURIComponent(id)}`);
}
