import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getTutorBundles } from "@/actions/bundles";
import { REVENUE } from "@/lib/payments/revenue";
import TutorBundlesClient from "./bundles-client";

export const dynamic = "force-dynamic";

export default async function TutorBundlesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const tutor = await db.tutor.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!tutor) redirect("/courses");

  const [result, courses] = await Promise.all([
    getTutorBundles(),
    // Only published courses can go in a bundle, so don't offer the others.
    db.course.findMany({
      where: { tutorId: tutor.id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        price: true,
        basePrice: true,
        currentPrice: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!result.ok) redirect("/courses");

  return (
    <TutorBundlesClient
      bundles={result.bundles.map((bundle: any) => ({
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        description: bundle.description,
        price: bundle.price,
        isActive: bundle.isActive,
        reviewStatus: bundle.reviewStatus,
        reviewNote: bundle.reviewNote,
        courses: bundle.items.map((item: any) => ({
          id: item.course.id,
          title: item.course.title,
          listPrice:
            item.course.currentPrice && item.course.currentPrice > 0
              ? item.course.currentPrice
              : (item.course.basePrice ?? item.course.price ?? 0),
        })),
      }))}
      availableCourses={courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        listPrice:
          course.currentPrice && course.currentPrice > 0
            ? course.currentPrice
            : (course.basePrice ?? course.price ?? 0),
      }))}
      limits={{
        maxDiscount: REVENUE.bundle.maxDiscount,
        minPrice: REVENUE.bundle.minPrice,
        minCourses: REVENUE.bundle.minCourses,
      }}
    />
  );
}
