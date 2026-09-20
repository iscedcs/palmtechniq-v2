import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CourseHero from "@/components/pages/courses/courseId/course-slug-hero";
import CoursePreview from "@/components/pages/courses/courseId/course-slug-preview";
import CurriculumTab from "@/components/pages/courses/courseId/curriculumtab";
import InstructorTab from "@/components/pages/courses/courseId/instructortab";
import OverviewTab from "@/components/pages/courses/courseId/overviewtab";
import ReviewsTab from "@/components/pages/courses/courseId/review-tab";
import StickyPurchaseCard from "@/components/pages/courses/courseId/stickyPurchaseCard";
import { checkUserEnrollment, getCourseById } from "@/data/course";
import { formatDurationMinutes, generateRandomAvatar } from "@/lib/utils";
import { GroupBuyingWidget } from "@/components/group-buying";
import { getMyGroupPurchase } from "@/actions/group-purchase";
import { getAverageRating } from "@/lib/reviews";
import { ReferralTracker } from "@/components/shared/referral-tracker";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { ORG_ID, breadcrumbJsonLd } from "@/lib/seo/structured-data";

export async function generateMetadata(props: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseById(courseId);

  if (!course) {
    // No "| PalmTechnIQ" suffix here — the root layout's title template
    // appends it, and spelling it out produced "... | PalmTechnIQ | PalmTechnIQ".
    return {
      title: "Course Not Found",
      description: "The course you're looking for doesn't exist.",
      robots: { index: false, follow: false },
    };
  }

  const description =
    course.description?.slice(0, 160) || "Learn with PalmTechnIQ";
  const courseUrl = absoluteUrl(`/courses/${course.slug || course.id}`);

  // A share card with no image is weak, so fall back to the site image rather
  // than emitting an empty array. Note this cannot detect a thumbnail whose
  // URL is present but dead; scripts/audit-course-thumbnails.ts clears those.
  const shareImage = course.thumbnail || absoluteUrl("/opengraph-image");

  return {
    title: course.title,
    description,
    alternates: {
      canonical: `/courses/${course.slug || course.id}`,
    },
    openGraph: {
      title: course.title,
      description,
      url: courseUrl,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      type: "website",
      siteName: "PalmTechnIQ",
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: [shareImage],
    },
  };
}

export default async function CourseSlugPage(props: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ ref?: string }>;
}) {
  const { courseId } = await props.params;
  const resolvedSearchParams = (await props.searchParams) ?? {};
  const refCode =
    typeof resolvedSearchParams.ref === "string"
      ? resolvedSearchParams.ref
      : undefined;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  // Keyed on the resolved id, not the route param. The param may be a slug,
  // and both of these match on id only — so arriving via a slug link used to
  // show an already-enrolled student the "Enroll" card.
  const [isEnrolled, { group: activeGroup }] = await Promise.all([
    checkUserEnrollment(course.id),
    getMyGroupPurchase(course.id),
  ]);

  // ── Price resolution: active promotion wins over course's own pricing ──
  const activePromo = course.activePromotion;
  const resolvedCurrentPrice = activePromo?.promoPrice
    ? activePromo.promoPrice
    : course.currentPrice && course.currentPrice > 0
      ? course.currentPrice
      : (course.basePrice ?? 0);

  // Crossed-out "was" price:
  //   • During promo  → always basePrice (e.g. ₦12,000) — consistent with course card
  //   • No promo      → basePrice only if currentPrice is lower (i.e. there's a regular discount)
  //   • Flash sale end → reverts naturally to currentPrice / basePrice (₦9,900 / ₦12,000)
  const resolvedOriginalPrice = activePromo?.promoPrice
    ? course.basePrice && course.basePrice > activePromo.promoPrice
      ? course.basePrice
      : undefined
    : course.currentPrice &&
        course.currentPrice > 0 &&
        course.basePrice &&
        course.basePrice > course.currentPrice
      ? course.basePrice
      : undefined;

  // Discount percentage — always computed against the crossed-out basePrice
  const resolvedDiscount =
    resolvedOriginalPrice && resolvedOriginalPrice > resolvedCurrentPrice
      ? Math.round(
          ((resolvedOriginalPrice - resolvedCurrentPrice) /
            resolvedOriginalPrice) *
            100,
        )
      : undefined;

  const totalDuration = course.modules?.reduce((sum: number, module: any) => {
    return sum + (module.duration || 0);
  }, 0);

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

  const avgRating = getAverageRating(course.reviews);
  const courseUrl = absoluteUrl(`/courses/${course.slug || course.id}`);

  // The price a student actually pays today, which is what the Offer must
  // state. A flash sale sets currentPrice below basePrice.
  const coursePrice =
    course.currentPrice && course.currentPrice > 0
      ? course.currentPrice
      : (course.basePrice ?? course.price ?? 0);

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description?.slice(0, 300) || "Learn with PalmTechnIQ",
    url: courseUrl,
    provider: { "@id": ORG_ID },
    // Always emit an image. Clearing the dead S3 thumbnails left most courses
    // with none at all, and Google treats a missing image as a weaker result.
    image: course.thumbnail || absoluteUrl("/opengraph-image"),
    ...(course.tutor?.user?.name && {
      instructor: {
        "@type": "Person",
        name: course.tutor.user.name,
      },
    }),
    ...(course.language && { inLanguage: course.language }),
    ...(course.publishedAt && {
      datePublished: new Date(course.publishedAt).toISOString(),
    }),
    dateModified: new Date(course.updatedAt).toISOString(),
    ...(course.level && {
      educationalLevel: course.level,
    }),
    ...(course.outcomes?.length && {
      teaches: course.outcomes,
    }),
    ...(course.requirements?.length && {
      coursePrerequisites: course.requirements,
    }),
    ...(totalLessonDuration && {
      timeRequired: `PT${Math.ceil(totalLessonDuration / 60)}H`,
    }),
    ...(course.reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: course.reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      "@type": "Offer",
      price: coursePrice,
      priceCurrency: course.currency || "NGN",
      // "Paid" or "Free" is what Google reads to decide whether to show a
      // price on the result at all.
      category: coursePrice > 0 ? "Paid" : "Free",
      availability: "https://schema.org/InStock",
      url: courseUrl,
    },
    isAccessibleForFree: coursePrice === 0,
    // Google's Course rich result needs an instance describing HOW the course
    // is delivered. Without hasCourseInstance the markup is valid but is not
    // eligible for the course enhancement, which is the part that earns the
    // extra space in results.
    hasCourseInstance: {
      "@type": "CourseInstance",
      // Self-paced: no fixed schedule, a student starts whenever they buy.
      courseMode: "Online",
      courseWorkload: totalLessonDuration
        ? `PT${Math.ceil(totalLessonDuration / 60)}H`
        : "PT1H",
      ...(course.language && { inLanguage: course.language }),
      ...(course.tutor?.user?.name && {
        instructor: {
          "@type": "Person",
          name: course.tutor.user.name,
        },
      }),
      offers: {
        "@type": "Offer",
        price: coursePrice,
        priceCurrency: course.currency || "NGN",
        category: coursePrice > 0 ? "Paid" : "Free",
        availability: "https://schema.org/InStock",
        url: courseUrl,
      },
    },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Courses", path: "/courses" },
    { name: course.title, path: `/courses/${course.slug || course.id}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      {refCode && <ReferralTracker refCode={refCode} />}
      <JsonLd data={[courseJsonLd, breadcrumb]} />
      <div className="pt-28">
        <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CourseHero
              title={course.title}
              subtitle={course.subtitle}
              tutor={
                course.tutor
                  ? {
                      id:
                        course.tutor.user?.username ||
                        course.tutor.referralCode ||
                        course.tutor.id,
                      user: {
                        name: course.tutor.user.name,
                        image: course.tutor.user.avatar || undefined,
                      },
                    }
                  : { user: { name: "Unknown Tutor", image: undefined } }
              }
              averageRating={avgRating}
              totalStudents={course.enrollments?.length || 0}
              duration={formatDurationMinutes(totalLessonDuration)}
            />
            <CoursePreview
              thumbnail={course.thumbnail!}
              previewVideo={course.previewVideo!}
              title={course.title}
            />

            <Tabs defaultValue="overview" className="mt-6 w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/5 text-white backdrop-blur-sm">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-8">
                <OverviewTab
                  description={course.description}
                  outcomes={course.outcomes}
                  requirements={course.requirements}
                />
              </TabsContent>
              <TabsContent value="curriculum">
                <CurriculumTab
                  modules={course.modules}
                  isEnrolled={isEnrolled}
                  courseId={course.id}
                />
              </TabsContent>
              <TabsContent value="instructor">
                <InstructorTab
                  tutor={{
                    id:
                      course.tutor?.user?.username ||
                      course.tutor?.referralCode ||
                      course.tutor?.id,
                    userId: course.tutor?.userId,
                    user: {
                      name: course.tutor?.user?.name || "PalmTechnIQ Tutor",
                      image:
                        course.tutor?.user.avatar ||
                        course.tutor?.user.image ||
                        generateRandomAvatar(),
                    },
                    rating: course.reviews.length ? avgRating : undefined,
                    students: course.enrollments.length || 0,
                    courses: course.tutor?.Course.length || 0,
                    bio: course.tutor?.user.bio || undefined,
                    title: course.tutor?.title || undefined,
                    expertise: course.tutor?.expertise || [],
                    experience: course.tutor?.experience || undefined,
                    hourlyRate: course.tutor?.hourlyRate || undefined,
                    otherCourses:
                      course.tutor?.Course.filter(
                        (c: any) => c.id !== course.id,
                      ) || [],
                  }}
                />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTab
                  reviews={course.reviews}
                  courseId={course.id}
                  isEnrolled={isEnrolled}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            {course.groupBuyingEnabled && course.groupTiers?.length ? (
              <div className="mb-6">
                <GroupBuyingWidget
                  courseId={course.id}
                  courseTitle={course.title}
                  tiers={course.groupTiers}
                  activeGroup={activeGroup}
                />
              </div>
            ) : null}
            <StickyPurchaseCard
              currentPrice={resolvedCurrentPrice}
              originalPrice={resolvedOriginalPrice}
              discount={resolvedDiscount}
              duration={totalLessonDuration}
              lessons={totalLessons}
              level={course.level}
              language={course.language}
              certificate={course.certificate!}
              isEnrolled={isEnrolled}
              isInCart={false}
              courseId={course.id}
              courseSlug={course.slug}
              courseTitle={course.title}
              courseDescription={course.description}
              courseThumbnail={course.thumbnail ?? undefined}
              flashSaleEnd={
                activePromo?.endDate ?? course.flashSaleEnd ?? undefined
              }
              isFlashSale={!!activePromo || (course.isFlashSale ?? false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
