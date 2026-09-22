import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  LearnFaqs,
  LearnHero,
  LearnSections,
  RelatedCourses,
} from "@/components/pages/learn/learn-ui";
import {
  CYBERSECURITY_GUIDES,
  findGuide,
  type Guide,
} from "@/data/learn/cybersecurity";
import { resolveRelatedCourses } from "@/lib/learn/related-courses";
import {
  ORG_ID,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site";

const HUB_PATH = "/learn/cybersecurity";

type Props = { params: Promise<{ slug: string }> };

/** Every guide, drafts included — a draft must still render so it can be
 *  previewed. It is kept out of the index by `robots` below, not by 404ing. */
export function generateStaticParams() {
  return CYBERSECURITY_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);

  if (!guide) {
    return { title: "Guide not found", robots: { index: false, follow: false } };
  }

  const url = absoluteUrl(`${HUB_PATH}/${guide.slug}`);
  const isDraft = guide.status === "draft";

  return {
    // No "| PalmTechnIQ" here — the root layout's title template appends it.
    title: guide.metaTitle,
    description: guide.description,
    keywords: [guide.targetQuery],
    alternates: { canonical: `${HUB_PATH}/${guide.slug}` },
    // A half-written guide that gets indexed does not merely fail to rank; thin
    // pages drag down the pages around them. Drafts stay out until published.
    ...(isDraft && { robots: { index: false, follow: false } }),
    openGraph: {
      title: guide.metaTitle,
      description: guide.description,
      url,
      type: "article",
      siteName: "PalmTechnIQ",
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.description,
    },
  };
}

function articleJsonLd(guide: Guide) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: absoluteUrl(`${HUB_PATH}/${guide.slug}`),
    mainEntityOfPage: absoluteUrl(`${HUB_PATH}/${guide.slug}`),
    datePublished: guide.updated,
    dateModified: guide.updated,
    inLanguage: "en",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: absoluteUrl("/opengraph-image"),
    ...(guide.sources?.length && {
      citation: guide.sources.map((source) => source.url),
    }),
  };
}

export default async function CybersecurityGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);

  if (!guide) {
    notFound();
  }

  const courses = await resolveRelatedCourses(guide.relatedCoursePaths);

  const structuredData: Record<string, unknown>[] = [
    articleJsonLd(guide),
    breadcrumbJsonLd([
      { name: "Learn Cybersecurity", path: HUB_PATH },
      { name: guide.title, path: `${HUB_PATH}/${guide.slug}` },
    ]),
  ];

  // Only mark up questions that have been answered. FAQ markup whose answers
  // are empty is a structured-data error, and Google penalises mismatches
  // between markup and what is visible on the page.
  const answeredFaqs = (guide.faqs ?? []).filter(
    (faq) => faq.answer.trim().length > 0,
  );
  if (answeredFaqs.length > 0) {
    structuredData.push(
      faqJsonLd(
        answeredFaqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        })),
      ),
    );
  }

  const updated = new Date(guide.updated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={structuredData} />

      <LearnHero
        eyebrow="Cybersecurity"
        title={guide.title}
        intro={guide.intro}
        meta={`Updated ${updated}`}
      />

      <LearnSections sections={guide.sections} />
      <LearnFaqs faqs={guide.faqs ?? []} />

      <RelatedCourses courses={courses} />

      {guide.sources?.length ? (
        <section className="pb-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-xl font-bold text-white">Sources</h2>
              <ul className="space-y-2">
                {guide.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-gray-400 underline-offset-4 transition-colors hover:text-neon-blue hover:underline">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href={HUB_PATH}
              className="inline-flex items-center gap-2 text-neon-blue transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              All cybersecurity guides
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
