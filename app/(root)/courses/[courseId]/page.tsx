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


export default async function CourseSlugPage(props: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await props.params;
  const course = await getCourseById(courseId);
  
  // Call the server action directly
  const isEnrolled = await checkUserEnrollment(courseId);

  if (!course) {
    return <div className="">Course not found</div>;
  }

  const totalDuration = course.modules?.reduce((sum, module) => {
    return sum + (module.duration || 0);
  }, 0);

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
    <div className="min-h-screen bg-background">
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
              averageRating={
                course.reviews?.length
                  ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
                    course.reviews.length
                  : 0
              }
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
                <CurriculumTab modules={course.modules} />
              </TabsContent>
              <TabsContent value="instructor">
                <InstructorTab
                  tutor={{
                    user: {
                      name: course.tutor?.user?.name || "PalmTechnIQ Tutor",
                      image:
                        course.tutor?.user.avatar || generateRandomAvatar(),
                    },
                    rating: course.reviews.length
                      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
                        course.reviews.length
                      : undefined,
                    students: course.enrollments.length || 0,
                    courses: course.tutor?.Course.length || 0,
                    bio: course.tutor?.user.bio || undefined,
                    title: course.tutor?.title || undefined,
                  }}
                  // tutor={
                  //   course.tutor || {
                  //     user: { name: "Unknown Tutor", image: undefined },
                  //   }
                  // }
                
                />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTab reviews={course.reviews} />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <StickyPurchaseCard
              currentPrice={course.currentPrice!}
              originalPrice={
                course.groupBuyingDiscount && course.groupBuyingDiscount > 0
                  ? course.basePrice!
                  : undefined
              }
              discount={
                course.groupBuyingDiscount && course.groupBuyingDiscount > 0
                  ? course.groupBuyingDiscount
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}