import { getAdminPromotions, getPromotionSettings } from "@/actions/promotions";
import AdminPromotionsClient from "./promotions-client";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotionsRes, settings] = await Promise.all([
    getAdminPromotions(),
    getPromotionSettings(),
  ]);

  return (
    <AdminPromotionsClient
      initialPromotions={
        promotionsRes && "promotions" in promotionsRes
          ? (promotionsRes.promotions ?? [])
          : []
      }
      initialSettings={settings}
    />
  );
}
