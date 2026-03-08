"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface CourseNavItem {
  id: string;
  title: string;
  slug: string | null;
  level: string | null;
  categoryId: string | null;
  categoryName: string | null;
}

export interface CategoryNavItem {
  id: string;
  name: string;
}

export async function getNavigationData() {
  try {
    // Fetch all published courses with category info
    const coursesPromise = db.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Fetch all active categories
    const categoriesPromise = db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    });

    const [courses, categories] = await Promise.all([
      coursesPromise,
      categoriesPromise,
    ]);

    // Transform courses for navigation
    const transformedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      level: course.level,
      categoryId: course.category?.id || null,
      categoryName: course.category?.name || null,
    })) as CourseNavItem[];

    // Group courses by level for the dropdown
    const coursesByLevel = transformedCourses.reduce(
      (acc, course) => {
        const level = (course.level || "Beginner") as string;
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push({
          label: course.title,
          href: `/courses/${course.id}`,
        });
        return acc;
      },
      {} as Record<string, Array<{ label: string; href: string }>>,
    );

    // Also group courses by category
    const coursesByCategory = transformedCourses.reduce(
      (acc, course) => {
        const categoryName = course.categoryName || "Other";
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push({
          label: course.title,
          href: `/courses/${course.id}`,
        });
        return acc;
      },
      {} as Record<string, Array<{ label: string; href: string }>>,
    );

    return {
      success: true,
      courses: transformedCourses,
      categories: categories as CategoryNavItem[],
      coursesByLevel,
      coursesByCategory,
    };
  } catch (error) {
    console.error("Error fetching navigation data:", error);
    return {
      success: false,
      courses: [],
      categories: [],
      coursesByLevel: {},
      coursesByCategory: {},
      error: "Failed to fetch navigation data",
    };
  }
}
