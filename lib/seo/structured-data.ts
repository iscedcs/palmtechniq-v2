/**
 * Schema.org structured data, built in one place.
 *
 * WHY THIS FILE EXISTS
 *
 * JSON-LD had grown in five separate files, each with its own hand-written
 * organisation block and its own hardcoded domain — the same drift that broke
 * the sitemap. Worse, the blocks disagreed: one called us an `Organization`
 * with no address at all, which is the single field Google needs to connect
 * the site to a Google Business Profile and put us in the local pack.
 *
 * Every builder here returns a plain object. Render it with `<JsonLd />` from
 * `components/seo/json-ld.tsx` — never with `<script>{JSON.stringify(x)}</script>`,
 * which lets React HTML-escape the payload and silently corrupts it.
 */

import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * The physical premises. Kept here so the address Google reads is the same
 * string shown on /contact, /terms and /privacy — a mismatch between the
 * markup and the visible page (or the Business Profile) is what stops the
 * listing being trusted.
 */
export const ORG_ADDRESS = {
  // Worded to match the Google Business Profile listing as closely as the
  // schema.org fields allow, including the LGA and postcode. Google checks the
  // address in this markup against the one on the Business Profile; the closer
  // they agree, the more confidently it ties the site to the listing, and the
  // listing is what puts a call button in the local results.
  streetAddress:
    "22 Rd 1st Floor, Chicken Republic Building (FESTAC Tower), Amuwo Odofin",
  addressLocality: "Festac Town",
  addressRegion: "Lagos",
  postalCode: "102102",
  addressCountry: "NG",
} as const;

export const ORG_EMAIL = "support@palmtechniq.com";
export const ORG_PHONE = "+2348079568910";

export const ORG_SAME_AS = [
  "https://www.facebook.com/palmtechniq/",
  "https://www.instagram.com/palmtechniq",
  "https://www.linkedin.com/company/palmtechniq/",
  "https://www.youtube.com/@palmtechniq_official",
  "https://x.com/palmtechniq/",
];

/** Stable node ids, so separate blocks on a page reference one entity rather
 *  than describing five unrelated ones. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type JsonLdObject = Record<string, unknown>;

/**
 * The publisher.
 *
 * `EducationalOrganization` rather than `Organization`: it is the accurate
 * type, and it is the one Google associates with course results. The address,
 * phone and geo are what make the entity eligible for the local pack once the
 * Business Profile is claimed.
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: "Palm TechnIQ",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/opengraph-image"),
      width: 1200,
      height: 630,
    },
    image: absoluteUrl("/opengraph-image"),
    description:
      "PalmTechnIQ is a Lagos-based learning platform for technical and vocational skills — cybersecurity, web development, data and design — taught online and in person, with mentorship and certification.",
    email: ORG_EMAIL,
    telephone: ORG_PHONE,
    address: {
      "@type": "PostalAddress",
      ...ORG_ADDRESS,
    },
    // Worldwide, not Nigeria: courses are delivered online to anyone. The
    // postal address above is the physical campus, and the two are not in
    // conflict — one is where the business is, the other is who it serves.
    areaServed: "Worldwide",
    // Mirrors the real category list, which spans trades and creative skills
    // as well as technology. Declaring only "Tech Courses" told search engines
    // the catalogue was narrower than it is.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Courses & Skills",
      itemListElement: [
        "AI, Data Science & Machine Learning",
        "Web, Mobile & Cloud Development",
        "Cybersecurity",
        "Design, Photography & Creative Skills",
        "Business, Marketing & Entrepreneurship",
        "Trades & Vocational Skills",
        "Health, Lifestyle & Personal Development",
      ].map((name) => ({ "@type": "OfferCatalog", name })),
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: ORG_EMAIL,
      telephone: ORG_PHONE,
      areaServed: "NG",
      availableLanguage: ["en"],
    },
    sameAs: ORG_SAME_AS,
  };
}

/** The site itself, with the sitelinks search box. */
export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = {
  name: string;
  /** Site-relative path. Made absolute here — a relative `item` is ignored. */
  path: string;
};

/**
 * Breadcrumbs.
 *
 * Google replaces the raw URL in the result with this trail, which is why it
 * belongs on every page that sits below the root and not only on course
 * detail. "Home" is prepended for you; pass the trail below it.
 */
export function breadcrumbJsonLd(trail: Crumb[]): JsonLdObject {
  const full: Crumb[] = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type FaqItem = { question: string; answer: string };

export function faqJsonLd(items: FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export type CourseListItem = {
  name: string;
  /** Site-relative path to the course. */
  path: string;
  description?: string | null;
};

/**
 * A listing page's courses, as an ordered `ItemList`.
 *
 * Listing pages carry no `Course` markup of their own, so Google has to guess
 * what a category page is about from prose alone. `ItemList` states it, and
 * the position of each entry tells Google the page is a collection rather than
 * a duplicate of the detail pages.
 */
export function courseListJsonLd(
  items: CourseListItem[],
  listName: string,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: item.name,
        url: absoluteUrl(item.path),
        ...(item.description && {
          description: item.description.slice(0, 300),
        }),
        provider: { "@id": ORG_ID },
      },
    })),
  };
}
