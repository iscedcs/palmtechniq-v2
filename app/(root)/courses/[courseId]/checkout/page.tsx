import { beginCheckout } from "@/actions/checkout";
import CheckoutCoursePage from "@/components/pages/courses/checkout/checkout-course";
import { getCourseById } from "@/data/course";
import { generateRandomAvatar } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) redirect("/courses");

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
          basePrice: course.basePrice ?? course.currentPrice ?? 0,
          currentPrice: course.currentPrice ?? 0,
          discountPercent:
            course.groupBuyingDiscount && course.groupBuyingDiscount > 0
              ? course.groupBuyingDiscount
              : undefined,
          vatRate: 0.075,
          currency: "NGN",
        }}
        onProceed={async () => {
          "use server";
          await beginCheckout(course.id);
        }}
      />
    </div>
  );
}
