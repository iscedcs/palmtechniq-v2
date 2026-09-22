import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  GuideList,
  LearnHero,
  LearnSections,
  RelatedCourses,
} from "@/components/pages/learn/learn-ui";
import {
  CYBERSECURITY_HUB,
  publishedGuides,
} from "@/data/learn/cybersecurity";
import { resolveRelatedCourses } from "@/lib/learn/related-courses";
import { ORG_ID, breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site";

const HUB_PATH = "/learn/cybersecurity";

export const metadata: Metadata = {
  title: CYBERSECURITY_HUB.metaTitle,
  description: CYBERSECURITY_HUB.description,
  keywords: [
    "learn cybersecurity",
    "cybersecurity for beginners",
    "cybersecurity career Nigeria",
    "cybersecurity training Lagos",
    "ethical hacking",
    "cybersecurity roadmap",
  ],
  alternates: { canonical: HUB_PATH },
  openGraph: {
    title: CYBERSECURITY_HUB.metaTitle,
    description: CYBERSECURITY_HUB.description,
    url: absoluteUrl(HUB_PATH),
    type: "website",
    siteName: "PalmTechnIQ",
  },
};

export default async function CybersecurityHubPage() {
  const guides = publishedGuides();
  const courses = await resolveRelatedCourses(
    CYBERSECURITY_HUB.relatedCoursePaths,
  );

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: CYBERSECURITY_HUB.title,
      description: CYBERSECURITY_HUB.description,
      url: absoluteUrl(HUB_PATH),
      publisher: { "@id": ORG_ID },
      ...(guides.length > 0 && {
        hasPart: guides.map((guide) => ({
          "@type": "Article",
          headline: guide.title,
          url: absoluteUrl(`${HUB_PATH}/${guide.slug}`),
        })),
      }),
    },
    // No "/learn" crumb: there is no index page at that path, and a breadcrumb
    // item pointing at a 404 devalues the whole trail.
    breadcrumbJsonLd([{ name: "Learn Cybersecurity", path: HUB_PATH }]),
  ];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={structuredData} />

      <LearnHero
        eyebrow="Learn"
        title="Learn"
        highlight="Cybersecurity"
        intro={CYBERSECURITY_HUB.intro}
      />

      <LearnSections sections={CYBERSECURITY_HUB.sections} />

      <GuideList
        guides={guides.map((guide) => ({
          slug: guide.slug,
          title: guide.title,
          description: guide.description,
        }))}
        basePath={HUB_PATH}
      />

      <RelatedCourses
        courses={courses}
        heading="Ready to start?"
        blurb="Taught live by people doing the work, with projects and a certificate you can verify."
      />

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href={CYBERSECURITY_HUB.categoryPath}
              className="text-neon-blue transition-colors hover:text-white">
              Browse all cybersecurity courses →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
