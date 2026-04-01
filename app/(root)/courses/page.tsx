import { getCategories } from "@/actions/tutor-actions";
import { getActivePromotion } from "@/actions/promotions";
import CoursesGrid from "@/components/pages/courses/course-grid";
import CoursePromotionPopup from "@/components/promotions/course-promotion-popup";
import { getPublicCourses } from "@/data/course";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse expert-led courses in AI, web development, data science, and career-focused technical skills. Learn at your own pace with practical projects and mentorship.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Browse Courses | PalmTechnIQ",
    description:
      "Browse expert-led courses in AI, web development, data science, and career-focused technical skills.",
    url: "https://palmtechniq.com/courses",
    type: "website",
  },
};

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
