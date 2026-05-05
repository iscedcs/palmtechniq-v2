import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getPost, getPostSlugs, getRelatedPosts } from "@/lib/sanity-queries";
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
import { CommentsSection } from "@/components/pages/blog/comments-section";
import { RelatedPosts } from "@/components/pages/blog/related-posts";

export const revalidate = 60;
const siteUrl = "https://palmtechniq.com";

type Props = {
  params: Promise<{ slug: string }>;
};

function extractHeadingTopics(headings?: Array<{ text?: string }>): string[] {
  if (!headings) return [];
  return headings
    .map((heading) => (heading.text || "").trim())
    .filter((heading) => heading.length >= 4)
    .map((heading) => heading.replace(/\s+/g, " "))
    .slice(0, 6);
}

export async function generateStaticParams() {
  try {
    const slugs = await getPostSlugs();
    return slugs.map((item: { slug: string }) => ({ slug: item.slug }));
  } catch {
    // Allow builds to succeed when Sanity is temporarily unreachable.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const canonicalUrl = post.seo?.canonicalUrl || `${siteUrl}/blog/${slug}`;
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : `${siteUrl}/images/og-default.png`;
  const publishedTime = post.publishedAt || post._createdAt;
  const modifiedTime = post._updatedAt || post.publishedAt || post._createdAt;
  const categoryNames = (post.categories || []).map(
    (cat: { title: string }) => cat.title,
  );
  const keywords = [
    "PalmTechnIQ",
    "tech education",
    "AI learning",
    "web development",
    "data science",
    ...(post.seo?.focusKeyword ? [post.seo.focusKeyword] : []),
    ...categoryNames,
  ];
  const pageTitle = post.seo?.metaTitle || post.title;
  const pageDescription =
    post.seo?.metaDescription ||
    post.excerpt ||
    `Read ${post.title} on PalmTechnIQ Blog`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    keywords,
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    creator: post.author?.name || "PalmTechnIQ",
    publisher: "PalmTechnIQ",
    category: categoryNames[0],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      type: "article",
      siteName: "PalmTechnIQ",
      publishedTime,
      modifiedTime,
      authors: post.author?.name ? [post.author.name] : undefined,
      section: categoryNames[0],
      tags: categoryNames,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.mainImage?.alt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      creator: "@palmtechniq",
      images: [imageUrl],
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
  const publishedTime = post.publishedAt || post._createdAt;
  const modifiedTime = post._updatedAt || post.publishedAt || post._createdAt;
  const postUrl = `${siteUrl}/blog/${post.slug.current}`;
  const canonicalUrl = post.seo?.canonicalUrl || postUrl;
  const categoryNames = (post.categories || []).map(
    (cat: { title: string }) => cat.title,
  );
  const headingTopics = extractHeadingTopics(post.headings);
  const topicCandidates = [
    ...new Set([...categoryNames, ...headingTopics]),
  ].slice(0, 8);
  const categorySet = new Set(
    categoryNames.map((name: string) => name.toLowerCase()),
  );
  const relatedTopics = topicCandidates.map((topic) => ({
    label: topic,
    href: categorySet.has(topic.toLowerCase())
      ? `/blog?topic=${encodeURIComponent(topic)}`
      : `/blog?q=${encodeURIComponent(topic)}`,
  }));
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description:
      post.seo?.metaDescription ||
      post.excerpt ||
      `Read ${post.title} on PalmTechnIQ Blog`,
    image: post.mainImage
      ? [urlFor(post.mainImage).width(1200).height(630).url()]
      : undefined,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: canonicalUrl,
    articleSection: categoryNames[0],
    keywords: [
      ...categoryNames,
      ...(post.seo?.focusKeyword ? [post.seo.focusKeyword] : []),
    ].join(", "),
    author: post.author?.name
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : {
          "@type": "Organization",
          name: "PalmTechnIQ",
        },
    publisher: {
      "@type": "Organization",
      name: "PalmTechnIQ",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/logo.webp`,
      },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json">
        {JSON.stringify(articleJsonLd)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>
      <ReadingProgressBar />

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
            <ViewTracker postId={post._id} />
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

          <div className="mt-12">
            <CommentsSection postId={post._id} postSlug={post.slug.current} />
          </div>

          {/* Related posts */}
          {relatedTopics.length > 0 && (
            <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-3">
                Related Topics
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Explore more content connected to this article.
              </p>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map((topic) => (
                  <Link
                    key={topic.label}
                    href={topic.href}
                    className="inline-flex items-center rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-sm text-neon-blue hover:bg-neon-blue/20 transition-colors">
                    {topic.label}
                  </Link>
                ))}
              </div>
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
