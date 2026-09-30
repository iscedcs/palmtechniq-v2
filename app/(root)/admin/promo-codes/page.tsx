import { getAdminPromoCodes } from "@/actions/promo-codes";
import AdminPromoCodesClient from "./promo-codes-client";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const res = await getAdminPromoCodes();

  return (
    <AdminPromoCodesClient
      initialPromoCodes={
        res && "promoCodes" in res ? (res.promoCodes ?? []) : []
      }
    />
  );
}
