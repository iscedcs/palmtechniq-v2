import { getCategories } from "@/actions/tutor-actions";
import { getActivePromotion } from "@/actions/promotions";
import CoursesGrid from "@/components/pages/courses/course-grid";
import CoursePromotionPopup from "@/components/promotions/course-promotion-popup";
import { getPublicCourses } from "@/data/course";
import { getPublicBundles } from "@/actions/bundles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse courses across trades, crafts, business, AI, cybersecurity and technology, taught by people who do the work. Learn at your own pace with projects, mentorship and certificates.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Browse Courses | PalmTechnIQ",
    description:
      "Browse courses across trades, crafts, business, AI, cybersecurity and technology, taught by people who do the work.",
    url: "https://palmtechniq.com/courses",
    type: "website",
  },
};

// Mark as dynamic to prevent prerender errors when DB is unavailable during build
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const [courses, categoriesResponse, activePromotion, bundles] =
    await Promise.all([
      getPublicCourses().catch((error) => {
        console.error("Failed to fetch courses:", error);
        return [];
      }),
      getCategories().catch((error) => {
        console.error("Failed to fetch categories:", error);
        return { success: false, categories: [] };
      }),
      getActivePromotion().catch((error) => {
        console.error("Failed to fetch active promotion:", error);
        return null;
      }),
      getPublicBundles().catch((error) => {
        console.error("Failed to fetch bundles:", error);
        return [];
      }),
    ]);

  const categories = categoriesResponse?.success
    ? categoriesResponse.categories
    : [];

  return (
    <div>
      <CoursesGrid
        courses={courses || []}
        categories={categories || []}
        bundles={bundles || []}
      />
      <CoursePromotionPopup promotion={activePromotion} />
    </div>
  );
}
