import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories } from "@/actions/tutor-actions";
import { getPublicBundles } from "@/actions/bundles";
import { getPublicCourses } from "@/data/course";
import CoursesGrid from "@/components/pages/courses/course-grid";

/**
 * A real page per category.
 *
 * The sitemap previously listed /courses?category=<slug>, but nothing in the
 * app produced that link and the courses page never read the parameter, so all
 * 26 URLs rendered the identical unfiltered list. Twenty-six duplicates of one
 * page is worse for ranking than not listing them at all.
 *
 * This gives each category a path, a title, a description and a canonical of
 * its own, and makes a filtered view something a student can bookmark or send
 * to someone.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function findCategory(slug: string) {
  const response = await getCategories().catch(() => null);
  const categories = response?.success ? response.categories : [];
  return {
    categories,
    category: categories.find(
      (item: { slug?: string; name: string }) => item.slug === slug,
    ),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await findCategory(slug);

  if (!category) return { title: "Category not found" };

  const title = `${category.name} Courses`;
  const description = `Learn ${category.name.toLowerCase()} on PalmTechnIQ. Practical courses taught by people who do the work, with projects, mentorship and a certificate you can verify.`;

  return {
    title,
    description,
    alternates: { canonical: `/courses/category/${slug}` },
    openGraph: {
      title: `${title} | PalmTechnIQ`,
      description,
      url: `https://palmtechniq.com/courses/category/${slug}`,
      type: "website",
      siteName: "PalmTechnIQ",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const [{ categories, category }, courses, bundles] = await Promise.all([
    findCategory(slug),
    getPublicCourses().catch(() => []),
    getPublicBundles().catch(() => []),
  ]);

  if (!category) notFound();

  return (
    <CoursesGrid
      courses={courses || []}
      categories={categories || []}
      bundles={bundles || []}
      initialCategory={category.name}
    />
  );
}
