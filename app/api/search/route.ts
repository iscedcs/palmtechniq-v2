import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

interface SearchResult {
  id: string;
  type: "course" | "user" | "category";
  title: string;
  subtitle?: string;
  image?: string;
  rating?: number;
  students?: number;
  price?: number;
  level?: string;
  url: string;
  relevanceScore?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding error:", error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

async function searchCourses(
  query: string,
  queryEmbedding: number[],
): Promise<SearchResult[]> {
  try {
    const courses = await db.course.findMany({
      where: {
        AND: [
          { status: "PUBLISHED" },
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { subtitle: { contains: query, mode: "insensitive" } },
              {
                tags: {
                  some: { name: { contains: query, mode: "insensitive" } },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        thumbnail: true,
        price: true,
        salePrice: true,
        level: true,
        reviews: {
          select: {
            rating: true,
          },
          take: 100,
        },
        enrollments: {
          select: {
            id: true,
          },
        },
      },
      take: 15,
    });

    return courses.map((course) => {
      const avgRating =
        course.reviews.length > 0
          ? (
              course.reviews.reduce((sum, r) => sum + r.rating, 0) /
              course.reviews.length
            ).toFixed(1)
          : null;

      return {
        id: course.id,
        type: "course",
        title: course.title,
        subtitle: course.subtitle,
        image: course.thumbnail || undefined,
        rating: avgRating ? parseFloat(avgRating) : undefined,
        students: course.enrollments.length,
        price: course.salePrice || course.price,
        level: course.level,
        url: `/courses/${course.slug || course.id}`,
      };
    });
  } catch (error) {
    console.error("Course search error:", error);
    return [];
  }
}

async function searchUsers(query: string): Promise<SearchResult[]> {
  try {
    const users = await db.user.findMany({
      where: {
        AND: [
          {
            role: {
              in: ["TUTOR", "MENTOR"],
            },
          },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
              {
                tutorProfile: {
                  OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { expertise: { hasSome: [query] } },
                  ],
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        role: true,
        tutorProfile: {
          select: {
            title: true,
            expertise: true,
            averageRating: true,
            totalReviews: true,
            totalStudents: true,
          },
        },
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      type: "user",
      title: user.name,
      subtitle:
        user.tutorProfile?.title || user.bio?.substring(0, 100) || user.role,
      image: user.image || undefined,
      rating: user.tutorProfile?.averageRating || undefined,
      students: user.tutorProfile?.totalStudents || 0,
      url: `/profile/${user.id}`,
    }));
  } catch (error) {
    console.error("User search error:", error);
    return [];
  }
}

async function searchCategories(query: string): Promise<SearchResult[]> {
  try {
    const categories = await db.category.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
      take: 8,
    });

    return categories.map((category) => ({
      id: category.id,
      type: "category",
      title: category.name,
      subtitle: `${category._count.courses} courses`,
      url: `/courses?category=${category.slug}`,
    }));
  } catch (error) {
    console.error("Category search error:", error);
    return [];
  }
}

function rankResults(results: SearchResult[], query: string): SearchResult[] {
  const queryLower = query.toLowerCase();

  return results.sort((a, b) => {
    // Exact match boost
    const aExactMatch = a.title.toLowerCase() === queryLower ? 10 : 0;
    const bExactMatch = b.title.toLowerCase() === queryLower ? 10 : 0;

    if (aExactMatch !== bExactMatch) {
      return bExactMatch - aExactMatch;
    }

    // Title match boost
    const aStartsWith = a.title.toLowerCase().startsWith(queryLower) ? 5 : 0;
    const bStartsWith = b.title.toLowerCase().startsWith(queryLower) ? 5 : 0;

    if (aStartsWith !== bStartsWith) {
      return bStartsWith - aStartsWith;
    }

    // Type priority: courses > users > categories
    const typePriority: { [key: string]: number } = {
      course: 3,
      user: 2,
      category: 1,
    };

    const aTypePriority = typePriority[a.type] || 0;
    const bTypePriority = typePriority[b.type] || 0;

    if (aTypePriority !== bTypePriority) {
      return bTypePriority - aTypePriority;
    }

    // Rating boost for courses
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;

    if (aRating !== bRating) {
      return bRating - aRating;
    }

    // Students/followers boost
    const aStudents = a.students || 0;
    const bStudents = b.students || 0;

    return bStudents - aStudents;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    // Validate query
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: "Search query is too long" },
        { status: 400 },
      );
    }

    // Get embedding for semantic search (optional, falls back to text search)
    let queryEmbedding: number[] = [];
    if (process.env.OPENAI_API_KEY) {
      queryEmbedding = await getEmbedding(query);
    }

    // Execute parallel searches
    const [courses, users, categories] = await Promise.all([
      searchCourses(query, queryEmbedding),
      searchUsers(query),
      searchCategories(query),
    ]);

    // Combine results
    const allResults = [...courses, ...users, ...categories];

    // Rank and sort results
    const rankedResults = rankResults(allResults, query);

    // Limit total results
    const limitedResults = rankedResults.slice(0, 20);

    return NextResponse.json({
      query,
      results: limitedResults,
      count: limitedResults.length,
      totalAvailable: allResults.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "An error occurred during search" },
      { status: 500 },
    );
  }
}
