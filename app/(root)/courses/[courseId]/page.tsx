import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CourseHero from "@/components/pages/courses/courseId/course-slug-hero";
import CoursePreview from "@/components/pages/courses/courseId/course-slug-preview";
import CurriculumTab from "@/components/pages/courses/courseId/curriculumtab";
import InstructorTab from "@/components/pages/courses/courseId/instructortab";
import OverviewTab from "@/components/pages/courses/courseId/overviewtab";
import ReviewsTab from "@/components/pages/courses/courseId/review-tab";
import StickyPurchaseCard from "@/components/pages/courses/courseId/stickyPurchaseCard";
import { checkUserEnrollment, getCourseById } from "@/data/course";
import { generateRandomAvatar } from "@/lib/utils";
import CourseNotFoundSkeleton from "@/components/shared/skeleton/course-not-found-skeleton";
import { GroupBuyingWidget } from "@/components/group-buying";
import { getMyGroupPurchase } from "@/actions/group-purchase";
import { getAverageRating } from "@/lib/reviews";
import { ReferralTracker } from "@/components/shared/referral-tracker";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseById(courseId);

  if (!course) {
    return {
      title: "Course Not Found | PalmTechnIQ",
      description: "The course you're looking for doesn't exist.",
    };
  }

  const description =
    course.description?.slice(0, 160) || "Learn with PalmTechnIQ";
  const courseUrl = `https://palmtechniq.com/courses/${course.slug || course.id}`;

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
      images: course.thumbnail
        ? [
            {
              url: course.thumbnail,
              width: 1200,
              height: 630,
              alt: course.title,
            },
          ]
        : [],
      type: "article",
      siteName: "PalmTechnIQ",
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: course.thumbnail ? [course.thumbnail] : [],
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

  // Call the server action directly
  const isEnrolled = await checkUserEnrollment(courseId);
  const { group: activeGroup } = await getMyGroupPurchase(courseId);

  if (!course) {
    return (
      <div className="">
        <CourseNotFoundSkeleton />
      </div>
    );
  }

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
  const courseUrl = `https://palmtechniq.com/courses/${course.slug || course.id}`;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description?.slice(0, 300) || "Learn with PalmTechnIQ",
    url: courseUrl,
    provider: {
      "@type": "Organization",
      name: "PalmTechnIQ",
      url: "https://palmtechniq.com",
    },
    ...(course.thumbnail && { image: course.thumbnail }),
    ...(course.tutor?.user?.name && {
      instructor: {
        "@type": "Person",
        name: course.tutor.user.name,
      },
    }),
    ...(course.language && { inLanguage: course.language }),
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
      price:
        course.currentPrice && course.currentPrice > 0
          ? course.currentPrice
          : (course.basePrice ?? 0),
      priceCurrency: course.currency || "NGN",
      availability: "https://schema.org/InStock",
      url: courseUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://palmtechniq.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: "https://palmtechniq.com/courses",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.title,
        item: courseUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {refCode && <ReferralTracker refCode={refCode} />}
      <script type="application/ld+json">{JSON.stringify(courseJsonLd)}</script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>
      <div className="pt-20">
        <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CourseHero
              title={course.title}
              subtitle={course.subtitle}
              tutor={
                course.tutor
                  ? {
                      user: {
                        name: course.tutor.user.name,
                        image: course.tutor.user.avatar || undefined,
                      },
                    }
                  : { user: { name: "Unknown Tutor", image: undefined } }
              }
              averageRating={avgRating}
              totalStudents={course.enrollments?.length || 0}
              duration={totalLessonDuration}
            />
            <CoursePreview
              thumbnail={course.thumbnail!}
              previewVideo={course.previewVideo!}
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
                    user: {
                      name: course.tutor?.user?.name || "PalmTechnIQ Tutor",
                      image:
                        course.tutor?.user.avatar || generateRandomAvatar(),
                    },
                    rating: course.reviews.length ? avgRating : undefined,
                    students: course.enrollments.length || 0,
                    courses: course.tutor?.Course.length || 0,
                    bio: course.tutor?.user.bio || undefined,
                    title: course.tutor?.title || undefined,
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
              currentPrice={
                course.currentPrice && course.currentPrice > 0
                  ? course.currentPrice
                  : (course.basePrice ?? 0)
              }
              originalPrice={
                course.currentPrice &&
                course.currentPrice > 0 &&
                course.basePrice &&
                course.basePrice > course.currentPrice
                  ? course.basePrice
                  : undefined
              }
              discount={
                course.currentPrice &&
                course.currentPrice > 0 &&
                course.basePrice &&
                course.basePrice > course.currentPrice
                  ? Math.round(
                      ((course.basePrice - course.currentPrice) /
                        course.basePrice) *
                        100,
                    )
                  : undefined
              }
              duration={`${totalLessonDuration} mins`}
              lessons={totalLessons}
              level={course.level}
              language={course.language}
              certificate={course.certificate!}
              isEnrolled={isEnrolled}
              isInCart={false}
              courseId={course.id}
              courseTitle={course.title}
              courseDescription={course.description}
              courseThumbnail={course.thumbnail ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
