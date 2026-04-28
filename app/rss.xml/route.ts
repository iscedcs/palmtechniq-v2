import { getFeedPosts } from "@/lib/sanity-queries";

const siteUrl = "https://palmtechniq.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const posts = await getFeedPosts(100);
    const buildDate = new Date().toUTCString();

    const items = posts
      .filter((post: { slug?: { current?: string } }) => post?.slug?.current)
      .map(
        (post: {
          title: string;
          slug: { current: string };
          excerpt?: string;
          publishedAt?: string;
          _createdAt?: string;
          _updatedAt?: string;
          seo?: { canonicalUrl?: string; metaDescription?: string };
          author?: { name?: string };
          categories?: Array<{ title?: string }>;
        }) => {
          const postUrl =
            post.seo?.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`;
          const title = escapeXml(post.title || "Untitled");
          const description = escapeXml(
            post.seo?.metaDescription || post.excerpt || "",
          );
          const pubDate = new Date(
            post.publishedAt || post._createdAt || Date.now(),
          ).toUTCString();
          const lastModified = new Date(
            post._updatedAt || post.publishedAt || post._createdAt || Date.now(),
          ).toUTCString();
          const author = escapeXml(post.author?.name || "PalmTechnIQ");
          const categories = (post.categories || [])
            .map((category) => category.title)
            .filter(Boolean)
            .map((category) => `<category>${escapeXml(category as string)}</category>`)
            .join("\n");

          return `<item>
  <title>${title}</title>
  <link>${postUrl}</link>
  <guid isPermaLink="true">${postUrl}</guid>
  <description>${description}</description>
  <author>editor@palmtechniq.com (${author})</author>
  <pubDate>${pubDate}</pubDate>
  <atom:updated>${lastModified}</atom:updated>
  ${categories}
</item>`;
        },
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>PalmTechnIQ Blog</title>
  <link>${siteUrl}/blog</link>
  <description>Latest articles on AI, web development, data science, and tech education.</description>
  <language>en-us</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
  ${items}
</channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response("RSS feed unavailable", { status: 503 });
  }
}
