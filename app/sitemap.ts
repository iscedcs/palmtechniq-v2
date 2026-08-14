import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getPostSlugs } from "@/lib/sanity-queries";
import { PROGRAMS } from "@/data/programs";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://palmtechniq.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/mentorship`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/mentorship`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/features/ai-interview`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/enroll`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-tutor`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/press`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/bootcamp`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Professional programs. The catalogue is static, so unlike the sections
  // below this needs no database and cannot silently produce nothing.
  const programPages: MetadataRoute.Sitemap = PROGRAMS.map((program) => ({
    url: `${baseUrl}/enroll/${program.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Dynamic course pages
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    });

    coursePages = courses.map(
      (course: { id: string; slug: string | null; updatedAt: Date }) => ({
        url: `${baseUrl}/courses/${course.slug || course.id}`,
        lastModified: course.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {
    // DB may not be available during build
  }

  // Category pages. Real paths, not ?category= query strings: nothing linked
  // to those, the courses page never read them, and all 26 rendered the same
  // unfiltered list.
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    categoryPages = categories.map(
      (category: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/courses/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    );
  } catch {
    // DB may not be available during build
  }

  // Course bundles. Only ones the platform has approved and the tutor has left
  // live, matching exactly what beginBundleCheckout will accept. Submitting a
  // bundle that refuses to sell would earn a crawl and a bounce.
  let bundlePages: MetadataRoute.Sitemap = [];
  try {
    const bundles = await db.courseBundle.findMany({
      where: { reviewStatus: "APPROVED", isActive: true },
      select: { slug: true, updatedAt: true },
    });

    bundlePages = bundles.map(
      (bundle: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/bundles/${bundle.slug}`,
        lastModified: bundle.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {
    // DB may not be available during build
  }

  // Dynamic blog post pages from Sanity
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPostSlugs();
    blogPages = posts.map(
      (post: { slug: string; publishedAt?: string; _updatedAt?: string }) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt || post.publishedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }),
    );
  } catch {
    // CMS may not be available during build
  }

  return [
    ...staticPages,
    ...programPages,
    ...coursePages,
    ...bundlePages,
    ...categoryPages,
    ...blogPages,
  ];
}
