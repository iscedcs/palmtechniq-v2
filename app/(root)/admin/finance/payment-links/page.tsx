import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getProgramPaymentLinks,
  getPaymentLinkFormOptions,
} from "@/actions/program-payment-links";
import PaymentLinksClient from "./payment-links-client";

export const dynamic = "force-dynamic";

export default async function AdminPaymentLinksPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/courses");
  }

  const [linksResult, optionsResult] = await Promise.all([
    getProgramPaymentLinks(),
    getPaymentLinkFormOptions(),
  ]);

  if (!linksResult.ok || !optionsResult.ok) redirect("/courses");

  return (
    <PaymentLinksClient
      links={linksResult.links}
      programs={optionsResult.programs}
      cohorts={optionsResult.cohorts}
    />
  );
}
