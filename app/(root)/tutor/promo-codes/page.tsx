import { getTutorPromoCodes } from "@/actions/promo-codes";
import TutorPromoCodesClient from "./promo-codes-client";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function TutorPromoCodesPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>Unauthorized</p>;

  const [promoCodesRes, courses] = await Promise.all([
    getTutorPromoCodes(),
    db.course.findMany({
      where: { tutor: { userId: session.user.id } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <TutorPromoCodesClient
      initialPromoCodes={
        promoCodesRes && "promoCodes" in promoCodesRes
          ? (promoCodesRes.promoCodes ?? [])
          : []
      }
      courses={courses}
    />
  );
}
