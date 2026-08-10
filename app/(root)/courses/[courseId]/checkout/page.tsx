import { auth } from "@/auth";
import { beginCheckout } from "@/actions/checkout";
import { beginGroupCheckout } from "@/actions/group-purchase";
import CheckoutCoursePage from "@/components/pages/courses/checkout/checkout-course";
import { getCourseById } from "@/data/course";
import { generateRandomAvatar } from "@/lib/utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

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

  // Group-buying cashback the buyer can spend here. Earners are excluded:
  // their balance is payout money, not course credit.
  const viewer = await auth();
  const buyer = viewer?.user?.id
    ? await db.user.findUnique({
        where: { id: viewer.user.id },
        select: { walletBalance: true, role: true },
      })
    : null;
  const courseCredit =
    buyer && !["TUTOR", "MENTOR", "ADMIN"].includes(buyer.role)
      ? Math.max(0, buyer.walletBalance)
      : 0;

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

  const totalLessonDuration = course.modules?.reduce(
    (sum: number, module: any) => {
      return (
        sum +
        module.lessons.reduce((lessonSum: number, lesson: any) => {
          return lessonSum + (lesson.duration || 0);
        }, 0)
      );
    },
    0,
  );

  const totalLessons = course.modules?.reduce((sum: number, module: any) => {
    return sum + module.lessons.length;
  }, 0);

  // ── Price resolution: active promotion wins over course's own pricing ──
  const activePromo = course.activePromotion;

  // Crossed-out "was" price → always basePrice (₦12,000), never activePromo.originalPrice
  const checkoutBasePrice =
    groupTier?.groupPrice ??
    (course.basePrice ?? 0);

  // currentPrice = what the user actually pays right now
  const checkoutCurrentPrice =
    groupTier?.groupPrice ??
    (activePromo?.promoPrice
      ? activePromo.promoPrice
      : (course.currentPrice && course.currentPrice > 0
          ? course.currentPrice
          : (course.basePrice ?? 0)));

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
            ? course.reviews.reduce((s: any, r: any) => s + r.rating, 0) /
              course.reviews.length
            : 0
        }
        pricing={{
          basePrice: checkoutBasePrice,
          currentPrice: checkoutCurrentPrice,
          discountPercent: groupTier
            ? undefined
            : course.groupBuyingDiscount && course.groupBuyingDiscount > 0
              ? course.groupBuyingDiscount
              : undefined,
          vatRate: 0.075,
          currency: "NGN",
        }}
        activePromoEndDate={activePromo?.endDate ?? undefined}
        groupTier={
          groupTier
            ? {
                size: groupTier.size,
                groupPrice: groupTier.groupPrice,
                cashbackPercent: groupTier.cashbackPercent ?? 0,
              }
            : undefined
        }
        courseCredit={courseCredit}
        onProceed={async (promoCode?: string) => {
          "use server";
          if (groupTier) {
            await beginGroupCheckout(course.id, groupTier.id);
            return;
          }
          const cookieStore = await cookies();
          const referralCode = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
          // Returns only when checkout is refused; success redirects.
          return beginCheckout(course.id, promoCode, referralCode);
        }}
      />
    </div>
  );
}
