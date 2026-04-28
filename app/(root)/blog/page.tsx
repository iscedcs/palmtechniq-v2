import {
  getPosts,
  getCategories,
  getFeaturedPosts,
} from "@/lib/sanity-queries";
import { BlogContent } from "@/components/pages/blog/blog-content";

export const revalidate = 60;
const siteUrl = "https://palmtechniq.com";

type BlogPageProps = {
  searchParams?: Promise<{
    q?: string;
    topic?: string;
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [posts, categories, featuredPosts] = await Promise.all([
    getPosts(),
    getCategories(),
    getFeaturedPosts(),
  ]);
  const resolvedSearchParams = (await searchParams) || {};
  const initialTopic = (resolvedSearchParams.topic || "").trim();
  const initialQuery = (resolvedSearchParams.q || "").trim();
  const matchingCategory = categories.find(
    (category: { title: string }) =>
      category.title.toLowerCase() === initialTopic.toLowerCase(),
  );

  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PalmTechnIQ Blog",
    itemListElement: posts
      .filter((post: { slug?: { current?: string } }) => post?.slug?.current)
      .map(
        (
          post: {
            title: string;
            slug: { current: string };
            publishedAt?: string;
          },
          index: number,
        ) => ({
          "@type": "ListItem",
          position: index + 1,
          name: post.title,
          url: `${siteUrl}/blog/${post.slug.current}`,
          datePublished: post.publishedAt,
        }),
      ),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(blogListJsonLd)}</script>
      <BlogContent
        posts={posts}
        categories={categories}
        featuredPosts={featuredPosts}
        initialCategory={matchingCategory?.title || null}
        initialSearchQuery={matchingCategory ? "" : initialTopic || initialQuery}
      />
    </>
  );
}
