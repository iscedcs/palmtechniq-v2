# SEO Implementation — PalmTechnIQ v2

**Date:** April 2026
**Scope:** Comprehensive SEO overhaul — Open Graph images, robots/sitemap, per-page metadata, structured data (JSON-LD), PWA manifest, 404 page

---

## Overview

Two implementation phases brought the platform from minimal SEO coverage to a production-complete setup.

| Phase   | Focus                                                     | Status      |
| ------- | --------------------------------------------------------- | ----------- |
| Phase 1 | OG images, robots/sitemap, per-page metadata, JSON-LD     | ✅ Complete |
| Phase 2 | Social profiles in JSON-LD, PWA manifest, custom 404 page | ✅ Complete |

## Problem

The platform had minimal SEO coverage:

- No Open Graph or Twitter card images existed (routes were referenced but never created)
- No `robots.txt` or `sitemap.xml` generation
- Only 3 out of 70+ pages had metadata exports
- No structured data beyond a basic Organization schema in the root layout
- No canonical URLs on individual pages
- Auth and dashboard pages were not blocked from crawlers
- Organization JSON-LD had empty `sameAs` (no social profiles)
- No web app manifest or PWA metadata (icons, theme-color)
- No custom 404 page

---

## What Was Implemented

### 1. Open Graph & Twitter Image Generation

| File                                                | Purpose                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `app/opengraph-image.tsx`                           | Site-wide OG image (1200×630). Branded dark design with logo, tagline, and feature pills.      |
| `app/twitter-image.tsx`                             | Site-wide Twitter card image. Same design as OG image.                                         |
| `app/(root)/courses/[courseId]/opengraph-image.tsx` | Per-course dynamic OG image. Renders course title, level badge, subtitle, and instructor name. |

All images use `next/og` (`ImageResponse`) with `runtime = "edge"`.

### 2. Crawler Directives

**`app/robots.ts`**

- Allows crawling of all public pages
- Blocks: `/api/`, `/admin/`, `/student/`, `/tutor/`, `/mentor/`, and all auth routes (`/login`, `/signup`, `/forgot-password`, `/new-password`, `/verify`, `/enroll/verify`)
- Points to `/sitemap.xml`

**`app/sitemap.ts`**

- Static entries for all public pages with appropriate `changeFrequency` and `priority` values
- Dynamic entries from DB:
  - All published courses (uses slug when available, falls back to id)
  - All active categories (as filtered course listing URLs)
- Gracefully handles missing DB during build via try/catch

### 3. Per-Page Metadata

Since most public pages are `"use client"` components (which cannot export `metadata`), metadata was added via `layout.tsx` files in each route directory.

| Route                    | File Created                                  | Title                  | Key Details                |
| ------------------------ | --------------------------------------------- | ---------------------- | -------------------------- |
| `/about`                 | `app/(root)/about/layout.tsx`                 | About Us               | canonical, OG              |
| `/contact`               | `app/(root)/contact/layout.tsx`               | Contact Us             | canonical, OG              |
| `/blog`                  | `app/(root)/blog/layout.tsx`                  | Blog                   | canonical, OG              |
| `/help`                  | `app/(root)/help/layout.tsx`                  | Help Center            | canonical, OG              |
| `/mentorship`            | `app/(root)/mentorship/layout.tsx`            | Mentorship Marketplace | canonical, OG              |
| `/become-a-tutor`        | `app/(root)/become-a-tutor/layout.tsx`        | Become a Tutor         | canonical, OG              |
| `/features/mentorship`   | `app/(root)/features/mentorship/layout.tsx`   | Mentorship Program     | canonical, OG              |
| `/features/ai-interview` | `app/(root)/features/ai-interview/layout.tsx` | AI Interview Prep      | canonical, OG              |
| `/careers`               | `app/(root)/careers/layout.tsx`               | Careers                | canonical, OG              |
| `/partners`              | `app/(root)/partners/layout.tsx`              | Partners               | canonical, OG              |
| `/press`                 | `app/(root)/press/layout.tsx`                 | Press                  | canonical, OG              |
| `/search`                | `app/(root)/search/layout.tsx`                | Search                 | `noindex` (search results) |
| `/privacy`               | `app/(root)/(legal)/privacy/layout.tsx`       | Privacy Policy         | canonical                  |
| `/terms`                 | `app/(root)/(legal)/terms/layout.tsx`         | Terms of Service       | canonical                  |
| Auth pages               | `app/(auth)/layout.tsx`                       | Sign In                | `noindex, nofollow`        |

**Server component pages updated directly:**

| Route                 | File Modified                            | Changes                                                          |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `/courses`            | `app/(root)/courses/page.tsx`            | Added `metadata` export with title, description, canonical, OG   |
| `/courses/[courseId]` | `app/(root)/courses/[courseId]/page.tsx` | Added canonical URL, changed OG type to `article`, added JSON-LD |

### 4. Structured Data (JSON-LD)

**Already existed in `app/layout.tsx`:**

- `Organization` schema
- `WebSite` schema with `SearchAction`

**Added to `app/(root)/courses/[courseId]/page.tsx`:**

**Course schema** (`schema.org/Course`):

- `name`, `description`, `url`, `image`
- `provider` (PalmTechnIQ organization)
- `instructor` (tutor name)
- `inLanguage`, `educationalLevel`
- `teaches` (course outcomes)
- `coursePrerequisites` (requirements)
- `timeRequired` (total lesson duration in ISO 8601)
- `aggregateRating` (from reviews, when available)
- `offers` (price, currency, availability)

**BreadcrumbList schema:**

- Home → Courses → [Course Title]

---

## Metadata Inheritance

All page metadata uses the root layout's `title.template` (`"%s | PalmTechnIQ"`), so page-level titles only need the page name (e.g., `"About Us"` renders as `"About Us | PalmTechnIQ"`).

The root layout's `openGraph.images` and `twitter.images` serve as fallbacks. Pages with their own OG image routes (like course pages) override these automatically.

---

## Phase 2 — Closing Gaps

### 5. Organization Social Profiles

**Modified `app/layout.tsx`** — Populated the `sameAs` array with verified social profile URLs:

```json
"sameAs": [
  "https://www.facebook.com/palmtechniq/",
  "https://www.instagram.com/palmtechniq",
  "https://www.linkedin.com/company/palmtechniq/",
  "https://www.youtube.com/@palmtechniq_official"
]
```

This enables Google Knowledge Panel to show social links for the organization.

### 6. Web App Manifest & PWA Metadata

**`app/manifest.ts`** — Next.js convention-based manifest generation:

- `name`: PalmTechnIQ
- `short_name`: PalmTechnIQ
- `display`: standalone
- `theme_color`: #10b981 (brand green)
- `background_color`: #0f172a (brand dark)
- `categories`: education, productivity
- `icons`: 192×192 and 512×512 from `/assets/standalone.png` (including maskable)

**Root metadata additions in `app/layout.tsx`:**

- `icons.icon` and `icons.apple` — favicon and Apple touch icon
- `theme-color` meta tag — #10b981
- `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` — iOS PWA support

### 7. Custom 404 Not Found Page

**`app/not-found.tsx`** — SEO-friendly 404 page:

- Title: "Page Not Found | PalmTechnIQ"
- `robots: { index: false, follow: true }` — prevents indexing dead URLs while still following links
- Clean UI with "Go Home" and "Browse Courses" CTAs
- Supports theme (uses `foreground`/`muted-foreground`/`accent` tokens)

---

## Files Changed Summary (All Phases)

### New Files (23)

```
# Phase 1
app/opengraph-image.tsx
app/twitter-image.tsx
app/robots.ts
app/sitemap.ts
app/(root)/about/layout.tsx
app/(root)/contact/layout.tsx
app/(root)/blog/layout.tsx
app/(root)/help/layout.tsx
app/(root)/mentorship/layout.tsx
app/(root)/become-a-tutor/layout.tsx
app/(root)/features/mentorship/layout.tsx
app/(root)/features/ai-interview/layout.tsx
app/(root)/careers/layout.tsx
app/(root)/partners/layout.tsx
app/(root)/press/layout.tsx
app/(root)/search/layout.tsx
app/(root)/(legal)/privacy/layout.tsx
app/(root)/(legal)/terms/layout.tsx
app/(auth)/layout.tsx
app/(root)/courses/[courseId]/opengraph-image.tsx

# Phase 2
app/manifest.ts
app/not-found.tsx
```

### Modified Files (3)

```
app/(root)/courses/page.tsx              — Added metadata export
app/(root)/courses/[courseId]/page.tsx    — Added canonical, JSON-LD (Course + BreadcrumbList)
app/layout.tsx                           — Added sameAs social links, icons, theme-color, PWA meta tags
```

---

## Final SEO Scorecard

| Area                       | Status | Details                                                                       |
| -------------------------- | ------ | ----------------------------------------------------------------------------- |
| Root metadata              | ✅     | Title template, description, keywords, authors, category, locale              |
| Open Graph images          | ✅     | Site-wide + per-course dynamic image generation                               |
| Twitter Cards              | ✅     | `summary_large_image`, site/creator handles                                   |
| robots.txt                 | ✅     | Blocks dashboards, auth, API; links to sitemap                                |
| sitemap.xml                | ✅     | 14 static pages + dynamic courses/categories from DB                          |
| Per-page metadata          | ✅     | 16 route layouts + 2 server component pages                                   |
| Course metadata            | ✅     | Dynamic `generateMetadata` with title, description, canonical, OG, Twitter    |
| JSON-LD: Organization      | ✅     | Name, URL, email, logo, social profiles                                       |
| JSON-LD: WebSite           | ✅     | SearchAction for sitelinks search box                                         |
| JSON-LD: Course            | ✅     | Provider, instructor, level, outcomes, prerequisites, duration, price, rating |
| JSON-LD: BreadcrumbList    | ✅     | Home → Courses → Course Title                                                 |
| Canonical URLs             | ✅     | Root + all page layouts + course pages                                        |
| Google verification        | ✅     | Google + Yandex verification tags                                             |
| Security headers           | ✅     | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy           |
| Analytics                  | ✅     | Google Analytics + Facebook Pixel                                             |
| `lang` attribute           | ✅     | `<html lang="en">`                                                            |
| Font optimization          | ✅     | `next/font/google` (Inter) — no layout shift                                  |
| Social profiles in JSON-LD | ✅     | Facebook, Instagram, LinkedIn, YouTube                                        |
| Web app manifest           | ✅     | PWA-ready with icons, theme-color, standalone display                         |
| Favicon & Apple touch icon | ✅     | Via metadata `icons` config                                                   |
| Custom 404 page            | ✅     | SEO-friendly with noindex, follow + navigation CTAs                           |

---

## Verification

After deployment, validate with:

1. **Open Graph Debugger:** https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **Google Rich Results Test:** https://search.google.com/test/rich-results
4. **Google Search Console:** Submit sitemap at `https://palmtechniq.com/sitemap.xml`
5. **Robots.txt:** Verify at `https://palmtechniq.com/robots.txt`
6. **Manifest:** Verify at `https://palmtechniq.com/manifest.webmanifest`
7. **Lighthouse:** Run Lighthouse SEO audit in Chrome DevTools (target: 100/100)
