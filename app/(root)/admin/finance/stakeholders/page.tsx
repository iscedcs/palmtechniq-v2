import { redirect } from "next/navigation";

import { listBanks, listStakeholders } from "@/actions/admin-stakeholders";
import StakeholdersClient from "./stakeholders-client";

export const dynamic = "force-dynamic";

export default async function AdminStakeholdersPage() {
  const data = await listStakeholders();
  if (!data.ok) redirect("/courses");

  // The bank list comes from Paystack and is only needed for the account form.
  // A failure here must not take the page down, so it degrades to a message.
  const banks = await listBanks();

  return (
    <StakeholdersClient
      stakeholders={data.stakeholders}
      activeTotal={data.activeTotal}
      validity={data.validity}
      staleDraft={data.staleDraft}
      banks={banks.ok ? banks.banks : []}
      bankError={banks.ok ? null : banks.error}
    />
  );
}
