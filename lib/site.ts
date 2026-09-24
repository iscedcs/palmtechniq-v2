/**
 * The canonical origin for the site. One source of truth.
 *
 * WHY THIS FILE EXISTS
 *
 * The domain was hardcoded in 62 places across 40 files, and drifted: the
 * sitemap was served on `www` while every URL inside it was non-`www`. Google
 * fetched it, discovered 11 of 75 URLs, and stopped re-reading it for nine
 * months. Two spellings of the same site also split ranking signals between
 * them.
 *
 * `www` is canonical. Everything — metadata, canonicals, sitemaps, RSS,
 * structured data, email links — must agree, so everything imports from here.
 *
 * Never hardcode the domain again. If you need it, import `SITE_URL`.
 */

/**
 * Canonical origin, no trailing slash.
 *
 * Overridable by env for preview deployments, but note that the value must be a
 * full origin (`https://host`), because it is used to build absolute URLs for
 * crawlers and email clients, which cannot resolve relative paths.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.palmtechniq.com"
).replace(/\/+$/, "");

/** Bare host, for display and for the `host` checks in redirects. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** The non-canonical spelling, kept only so redirects can name it. */
export const SITE_HOST_ALTERNATE = SITE_HOST.startsWith("www.")
  ? SITE_HOST.slice(4)
  : `www.${SITE_HOST}`;

export const SITE_NAME = "PalmTechnIQ";

/**
 * Build an absolute URL.
 *
 * Absolute URLs are required in sitemaps, RSS, Open Graph tags, JSON-LD and
 * email — a relative path in any of those is either ignored or broken.
 */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The canonical path to a course's public page.
 *
 * `/courses/<id>` and `/courses/<slug>` both resolve, but the page declares the
 * slug form canonical. Linking to the id form means every internal link a
 * crawler follows lands on a URL that immediately points somewhere else — a
 * wasted hop on each one, and link signals split across two addresses. Build
 * course links through this so they always agree with the canonical tag.
 */
export function coursePath(course: {
  id: string;
  slug?: string | null;
}): string {
  return `/courses/${course.slug || course.id}`;
}

/**
 * The canonical path to a tutor's public profile.
 *
 * A profile resolves by four identifiers — tutor id, user id, referral code
 * and username — and the page used to build its canonical tag from whichever
 * one the visitor arrived with. So the same profile existed at four URLs, each
 * declaring *itself* the original: textbook duplicate content, with the
 * ranking signals split four ways instead of accumulating on one page.
 *
 * The username is canonical where set — it is the form a human would share and
 * the one that reads well in a result — falling back to the tutor id, which
 * always exists. Every alias keeps resolving; they just agree now on which one
 * is the real address.
 */
export function tutorPath(tutor: {
  id: string;
  username?: string | null;
}): string {
  return `/tutors/${tutor.username || tutor.id}`;
}
