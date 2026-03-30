import { getCategories } from "@/actions/tutor-actions";
import { getActivePromotion } from "@/actions/promotions";
import CoursesGrid from "@/components/pages/courses/course-grid";
import CoursePromotionPopup from "@/components/promotions/course-promotion-popup";
import { getPublicCourses } from "@/data/course";

// Mark as dynamic to prevent prerender errors when DB is unavailable during build
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const [courses, categoriesResponse, activePromotion] = await Promise.all([
    getPublicCourses(),
    getCategories(),
    getActivePromotion(),
  ]);

  const categories = categoriesResponse.success
    ? categoriesResponse.categories
    : [];

  return (
    <div>
      <CoursesGrid courses={courses} categories={categories} />
      <CoursePromotionPopup promotion={activePromotion} />
    </div>
  );
}
