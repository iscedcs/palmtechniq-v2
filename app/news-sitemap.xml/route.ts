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
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const newsItems = posts
      .filter((post: { slug?: { current?: string }; publishedAt?: string }) => {
        if (!post?.slug?.current) return false;
        const published = new Date(post.publishedAt || 0).getTime();
        return Number.isFinite(published) && published >= twoDaysAgo;
      })
      .slice(0, 1000)
      .map(
        (post: {
          title: string;
          slug: { current: string };
          publishedAt?: string;
          seo?: { canonicalUrl?: string };
        }) => {
          const postUrl =
            post.seo?.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`;
          const publicationDate = new Date(
            post.publishedAt || Date.now(),
          ).toISOString();

          return `<url>
  <loc>${postUrl}</loc>
  <news:news>
    <news:publication>
      <news:name>PalmTechnIQ Blog</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>${publicationDate}</news:publication_date>
    <news:title>${escapeXml(post.title || "Untitled")}</news:title>
  </news:news>
</url>`;
        },
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsItems}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response("News sitemap unavailable", { status: 503 });
  }
}
