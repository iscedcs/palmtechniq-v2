import { getTutorPromotions, getPromotionSettings } from "@/actions/promotions";
import TutorPromotionsClient from "./promotions-client";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TutorPromotionsPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>Unauthorized</p>;

  const [promotionsRes, settings, courses] = await Promise.all([
    getTutorPromotions(),
    getPromotionSettings(),
    db.course.findMany({
      where: {
        tutor: { userId: session.user.id },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        currentPrice: true,
        price: true,
      },
    }),
  ]);

  return (
    <Suspense>
      <TutorPromotionsClient
        initialPromotions={
          promotionsRes && "promotions" in promotionsRes
            ? (promotionsRes.promotions ?? [])
            : []
        }
        courses={courses}
        promotionFee={settings.tutorPromotionFee}
        defaultDays={settings.defaultPromotionDays}
      />
    </Suspense>
  );
}
