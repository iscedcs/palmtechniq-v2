import {
  getPosts,
  getCategories,
  getFeaturedPosts,
} from "@/lib/sanity-queries";
import { BlogContent } from "@/components/pages/blog/blog-content";

export const revalidate = 60;

export default async function BlogPage() {
  const [posts, categories, featuredPosts] = await Promise.all([
    getPosts(),
    getCategories(),
    getFeaturedPosts(),
  ]);

  return (
    <BlogContent
      posts={posts}
      categories={categories}
      featuredPosts={featuredPosts}
    />
  );
}
