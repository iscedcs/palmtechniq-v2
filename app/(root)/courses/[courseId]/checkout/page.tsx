import { beginCheckout } from "@/actions/checkout";
import { beginGroupCheckout } from "@/actions/group-purchase";
import CheckoutCoursePage from "@/components/pages/courses/checkout/checkout-course";
import { getCourseById } from "@/data/course";
import { generateRandomAvatar } from "@/lib/utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ groupTierId?: string }>;
}) {
  const { courseId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const course = await getCourseById(courseId);

  if (!course) redirect("/courses");

  const groupTierId =
    typeof resolvedSearchParams.groupTierId === "string"
      ? resolvedSearchParams.groupTierId
      : undefined;
  const groupTier = groupTierId
    ? await db.groupTier.findFirst({
        where: { id: groupTierId, courseId: course.id, isActive: true },
      })
    : null;

  if (groupTierId && !groupTier) {
    redirect(`/courses/${courseId}`);
  }

  const totalLessonDuration = course.modules?.reduce((sum, module) => {
    return (
      sum +
      module.lessons.reduce((lessonSum, lesson) => {
        return lessonSum + (lesson.duration || 0);
      }, 0)
    );
  }, 0);

  const totalLessons = course.modules?.reduce((sum, module) => {
    return sum + module.lessons.length;
  }, 0);

  return (
    <div>
      <CheckoutCoursePage
        courseId={course.id}
        instructor={
          course.tutor
            ? {
                avatar: course.tutor.user?.avatar || generateRandomAvatar(),
                user: { name: course.tutor.user?.name || "PalmTechnIQ Tutor" },
              }
            : { user: { name: "PalmTechnIQ Tutor" } }
        }
        title={course?.title}
        subtitle={course?.subtitle}
        duration={totalLessonDuration}
        totalLesson={totalLessons}
        rating={
          course.reviews?.length
            ? course.reviews.reduce((s, r) => s + r.rating, 0) /
              course.reviews.length
            : 0
        }
        pricing={{
          basePrice: groupTier?.groupPrice ?? course.basePrice ?? 0,
          currentPrice:
            groupTier?.groupPrice ?? course.currentPrice ?? course.basePrice ?? 0,
          discountPercent: groupTier
            ? undefined
            :
            course.groupBuyingDiscount && course.groupBuyingDiscount > 0
              ? course.groupBuyingDiscount
              : undefined,
          vatRate: 0.075,
          currency: "NGN",
        }}
        groupTier={
          groupTier
            ? {
                size: groupTier.size,
                groupPrice: groupTier.groupPrice,
                cashbackPercent: groupTier.cashbackPercent ?? 0,
              }
            : undefined
        }
        onProceed={async (promoCode?: string) => {
          "use server";
          if (groupTier) {
            await beginGroupCheckout(course.id, groupTier.id);
            return;
          }
          await beginCheckout(course.id, promoCode);
        }}
      />
    </div>
  );
}
