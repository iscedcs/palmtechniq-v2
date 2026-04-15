import { getPosts, getCategories } from "@/lib/sanity-queries";
import { BlogContent } from "@/components/pages/blog/blog-content";

export const revalidate = 60;

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  return <BlogContent posts={posts} categories={categories} />;
}
