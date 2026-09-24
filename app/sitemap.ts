import type { MetadataRoute } from "next";
import { SITE_URL, tutorPath } from "@/lib/site";
import { db } from "@/lib/db";
import { getPostSlugs } from "@/lib/sanity-queries";
import { PROGRAMS } from "@/data/programs";
import { publishedGuides } from "@/data/learn/cybersecurity";

export const dynamic = "force-dynamic";

/**
 * Build one section of the sitemap, loudly.
 *
 * Every section used to swallow its own failure with `catch {}` and a comment
 * about the database maybe being unavailable during build. That is a real
 * case, but the silence cost us: a `select` naming a column that does not
 * exist threw on every single request, and the section just came out empty —
 * indistinguishable from "this site has no tutors". The sitemap looked fine.
 *
 * A build with no database still produces a sitemap, because a failed section
 * returns []. The difference is that now it says so. The empty-but-no-error
 * case is warned about separately: a query that succeeds and returns nothing
 * is usually a filter that has drifted, and it reads identically in the XML.
 */
async function buildSection(
  name: string,
  build: () => Promise<MetadataRoute.Sitemap>,
): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await build();
    if (entries.length === 0) {
      console.warn(
        `sitemap: "${name}" produced no URLs. If that is unexpected, the query succeeded but its filter matched nothing.`,
      );
    }
    return entries;
  } catch (error) {
    console.error(`sitemap: "${name}" failed and was left out`, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

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

  // Topic hubs and their guides. Static content, so like the programs above
  // this needs no database. Only published guides are listed — submitting a
  // half-written page invites a crawl of something we do not want indexed.
  const learnPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/learn/cybersecurity`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...publishedGuides().map((guide) => ({
      url: `${baseUrl}/learn/cybersecurity/${guide.slug}`,
      lastModified: new Date(guide.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
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
  const coursePages = await buildSection("course pages", async () => {
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    });

    return courses.map(
      (course: { id: string; slug: string | null; updatedAt: Date }) => ({
        url: `${baseUrl}/courses/${course.slug || course.id}`,
        lastModified: course.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  });

  // Category pages. Real paths, not ?category= query strings: nothing linked
  // to those, the courses page never read them, and all 26 rendered the same
  // unfiltered list.
  const categoryPages = await buildSection("category pages", async () => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    return categories.map(
      (category: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/courses/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    );
  });

  // Tutor profiles. Nothing pointed Google at these — they were indexable but
  // absent from the sitemap and linked only from a couple of pages, so they sat
  // undiscovered. Instructor-name searches are worth having, so they belong
  // here.
  //
  // Only profiles the page will actually render: a tutor whose user has set
  // publicProfile to false gets the "set to private" screen, and submitting
  // that earns a crawl of a page a visitor cannot read. The URL is the
  // canonical username form, matching the page's own canonical tag.
  const tutorPages = await buildSection("tutor profiles", async () => {
    const tutors = await db.tutor.findMany({
      select: {
        id: true,
        // Tutor has no updatedAt of its own; the user row carries it.
        user: {
          select: { username: true, preferences: true, updatedAt: true },
        },
      },
    });

    return tutors
      .filter((tutor: { user: { preferences: unknown } }) => {
        const prefs =
          (tutor.user.preferences as Record<string, unknown> | null) || {};
        return prefs.publicProfile !== false;
      })
      .map(
        (tutor: {
          id: string;
          user: { username: string | null; updatedAt: Date };
        }) => ({
          url: `${baseUrl}${tutorPath({ id: tutor.id, username: tutor.user.username })}`,
          lastModified: tutor.user.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }),
      );
  });

  // Course bundles. Only ones the platform has approved and the tutor has left
  // live, matching exactly what beginBundleCheckout will accept. Submitting a
  // bundle that refuses to sell would earn a crawl and a bounce.
  const bundlePages = await buildSection("course bundles", async () => {
    const bundles = await db.courseBundle.findMany({
      where: { reviewStatus: "APPROVED", isActive: true },
      select: { slug: true, updatedAt: true },
    });

    return bundles.map(
      (bundle: { slug: string; updatedAt: Date }) => ({
        url: `${baseUrl}/bundles/${bundle.slug}`,
        lastModified: bundle.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  });

  // Dynamic blog post pages from Sanity
  const blogPages = await buildSection("blog posts", async () => {
    const posts = await getPostSlugs();
    return posts.map(
      (post: { slug: string; publishedAt?: string; _updatedAt?: string }) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post._updatedAt || post.publishedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }),
    );
  });

  return [
    ...staticPages,
    ...learnPages,
    ...programPages,
    ...coursePages,
    ...bundlePages,
    ...tutorPages,
    ...categoryPages,
    ...blogPages,
  ];
}
