import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getPost, getRelatedPosts } from "@/lib/sanity-queries";
import { urlFor } from "@/lib/sanity";
import { Footer } from "@/components/footer";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { ReadingProgressBar } from "@/components/pages/blog/reading-progress-bar";
import { TableOfContents } from "@/components/pages/blog/table-of-contents";
import { LikeButton } from "@/components/pages/blog/like-button";
import { ShareButtons } from "@/components/pages/blog/share-buttons";
import { ViewTracker } from "@/components/pages/blog/view-tracker";
import { BookmarkButton } from "@/components/pages/blog/bookmark-button";
import { AuthorCard } from "@/components/pages/blog/author-card";
import { RelatedPosts } from "@/components/pages/blog/related-posts";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on PalmTechnIQ Blog`,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://palmtechniq.com/blog/${slug}`,
      type: "article",
      ...(post.mainImage && {
        images: [{ url: urlFor(post.mainImage).width(1200).height(630).url() }],
      }),
    },
  };
}

const portableTextComponents = {
  types: {
    image: ({
      value,
    }: {
      value: { asset: { _ref: string }; alt?: string; caption?: string };
    }) => (
      <figure className="my-8">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={urlFor(value).width(1200).height(675).url()}
            alt={value.alt || "Blog image"}
            fill
            className="object-cover"
          />
        </div>
        {value.caption && (
          <figcaption className="text-center text-sm text-gray-400 mt-2">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
    code: ({ value }: { value: { code: string; language?: string } }) => (
      <pre className="my-6 p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto">
        <code className="text-sm text-gray-200 font-mono">{value.code}</code>
      </pre>
    ),
  },
  marks: {
    link: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value?: { href: string };
    }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-neon-blue hover:underline">
        {children}
      </a>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="px-1.5 py-0.5 rounded bg-white/10 text-neon-blue text-sm font-mono">
        {children}
      </code>
    ),
  },
  block: {
    h2: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value?: { _key?: string };
    }) => (
      <h2
        id={value?._key ? `heading-${value._key}` : undefined}
        className="text-3xl font-bold text-white mt-10 mb-4 scroll-mt-20">
        {children}
      </h2>
    ),
    h3: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value?: { _key?: string };
    }) => (
      <h3
        id={value?._key ? `heading-${value._key}` : undefined}
        className="text-2xl font-semibold text-white mt-8 mb-3 scroll-mt-20">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-xl font-semibold text-white mt-6 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-neon-blue/50 pl-4 my-6 text-gray-300 italic">
        {children}
      </blockquote>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4 ml-4">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-4 ml-4">
        {children}
      </ol>
    ),
  },
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const categoryIds = post.categories?.map((c: { _id: string }) => c._id) ?? [];
  const relatedPosts = await getRelatedPosts(post._id, categoryIds);

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgressBar />
      <ViewTracker postId={post._id} />

      {/* Hero with image */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-10" />

        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-neon-blue transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat: { _id: string; title: string }) => (
                <span
                  key={cat._id}
                  className="inline-block px-3 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-sm font-semibold">
                  {cat.title}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-4">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.image ? (
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span>{post.author.name}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {post.readingTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime} min read</span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <LikeButton postId={post._id} />
            <BookmarkButton postId={post._id} />
            <div className="ml-auto">
              <ShareButtons title={post.title} slug={post.slug.current} />
            </div>
          </div>

          {post.mainImage && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12">
              <Image
                src={urlFor(post.mainImage).width(1200).height(675).url()}
                alt={post.mainImage.alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Table of Contents */}
          {post.headings && post.headings.length > 0 && (
            <TableOfContents headings={post.headings} />
          )}

          <article className="prose prose-invert max-w-none">
            {post.body && (
              <PortableText
                value={post.body}
                components={portableTextComponents}
              />
            )}
          </article>

          {/* Author card */}
          {post.author && (
            <div className="mt-12">
              <AuthorCard author={post.author} />
            </div>
          )}

          {/* Related posts */}
          <RelatedPosts posts={relatedPosts} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
