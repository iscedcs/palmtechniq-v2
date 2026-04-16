import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { urlFor } from "@/lib/sanity";

interface RelatedPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  publishedAt: string;
  readingTime?: number;
  categories?: { _id: string; title: string }[];
}

export function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-white/10">
      <h2 className="text-2xl font-bold text-white mb-8">
        Related Articles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group glass-card border border-white/10 rounded-xl overflow-hidden hover:border-neon-blue/30 transition-all duration-300"
          >
            {post.mainImage ? (
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={urlFor(post.mainImage).width(400).height(225).url()}
                  alt={post.mainImage.alt || post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="h-40 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20" />
            )}
            <div className="p-5">
              {post.categories && post.categories.length > 0 && (
                <span className="text-xs font-medium text-neon-blue">
                  {post.categories[0].title}
                </span>
              )}
              <h3 className="text-base font-semibold text-white mt-1 mb-2 line-clamp-2 group-hover:text-neon-blue transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime} min
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
