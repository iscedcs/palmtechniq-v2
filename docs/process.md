# PalmTechnIQ SEO — Process & Progress Tracker

> Living document tracking all SEO improvements applied to the platform.

---

## Phase 1 — Foundation (Completed)

Initial SEO infrastructure build-out.

| #   | Item                                                                     | Status | Files                                               |
| --- | ------------------------------------------------------------------------ | ------ | --------------------------------------------------- |
| 1   | Site-wide OG image (1200×630, edge runtime)                              | Done   | `app/opengraph-image.tsx`                           |
| 2   | Site-wide Twitter image                                                  | Done   | `app/twitter-image.tsx`                             |
| 3   | `robots.ts` — blocks private routes, links sitemap                       | Done   | `app/robots.ts`                                     |
| 4   | Dynamic `sitemap.ts` — static pages + DB-driven courses/categories       | Done   | `app/sitemap.ts`                                    |
| 5   | Root layout metadata — title template, OG, Twitter, robots, verification | Done   | `app/layout.tsx`                                    |
| 6   | Organization + WebSite JSON-LD with SearchAction                         | Done   | `app/layout.tsx`                                    |
| 7   | Per-page metadata via `layout.tsx` for 16 routes                         | Done   | Various `layout.tsx` files                          |
| 8   | Course detail `generateMetadata` + Course JSON-LD + BreadcrumbList       | Done   | `app/(root)/courses/[courseId]/page.tsx`            |
| 9   | Per-course dynamic OG image                                              | Done   | `app/(root)/courses/[courseId]/opengraph-image.tsx` |
| 10  | Courses listing page metadata                                            | Done   | `app/(root)/courses/page.tsx`                       |

---

## Phase 2 — Gap Closure (Completed)

Closed remaining infrastructure gaps.

| #   | Item                                         | Status | Files               |
| --- | -------------------------------------------- | ------ | ------------------- |
| 1   | Social profile URLs in Organization `sameAs` | Done   | `app/layout.tsx`    |
| 2   | PWA manifest                                 | Done   | `app/manifest.ts`   |
| 3   | Icons + theme-color metadata                 | Done   | `app/layout.tsx`    |
| 4   | Custom 404 page with noindex                 | Done   | `app/not-found.tsx` |

---

## Phase 3 — Critical + High Priority Fixes (Completed — April 15, 2026)

Addressed all critical and high-impact findings from the full SEO audit.

| #   | Item                                                                                                                                                     | Impact   | Status | Files Changed                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Homepage metadata + EducationalOrganization JSON-LD** — Added unique title/description/OG, EducationalOrganization structured data with course catalog | Critical | Done   | `app/page.tsx`                                                                                                                                                                                                                                  |
| 2   | **Add X/Twitter to Organization sameAs** — Google uses sameAs for Knowledge Panel                                                                        | Critical | Done   | `app/layout.tsx`                                                                                                                                                                                                                                |
| 3   | **Fix "CyberLearn" branding** — Replaced all 12 CyberLearn references with PalmTechnIQ across about, partners, press                                     | Critical | Done   | `app/(root)/about/page.tsx`, `app/(root)/partners/page.tsx`, `app/(root)/press/page.tsx`                                                                                                                                                        |
| 4   | **FAQPage JSON-LD on help page** — Enables Google rich result FAQ snippets                                                                               | High     | Done   | `app/(root)/help/layout.tsx`                                                                                                                                                                                                                    |
| 5   | **Course JSON-LD datePublished/dateModified** — Freshness signal for Google                                                                              | High     | Done   | `app/(root)/courses/[courseId]/page.tsx`                                                                                                                                                                                                        |
| 6   | **Fix heading skip in HeroSection** — Changed h3→h2 under h1 (proper hierarchy)                                                                          | High     | Done   | `components/hero-section.tsx`                                                                                                                                                                                                                   |
| 7   | **Unique auth page titles** — Each auth page gets its own title instead of shared "Sign In"                                                              | High     | Done   | `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/new-password/layout.tsx` (new), `app/(auth)/verify/layout.tsx` (new)                                     |
| 8   | **Enroll page canonical + OpenGraph** — Added missing canonical URL and OG config                                                                        | High     | Done   | `app/(root)/enroll/page.tsx`                                                                                                                                                                                                                    |
| 9   | **Noindex checkout/payment pages** — Prevents Google from indexing transactional pages                                                                   | High     | Done   | `app/(root)/courses/[courseId]/checkout/page.tsx`, `app/(root)/courses/verify-course-payment/page.tsx`, `app/(root)/mentorship/checkout/layout.tsx` (new), `app/(root)/mentorship/verify-payment/page.tsx`, `app/(root)/enroll/verify/page.tsx` |

### Also fixed in this phase:

- Course detail OG type corrected from `"article"` to `"website"`
- Auth layout title changed from static `"Sign In"` to template-based `"%s | PalmTechnIQ"` with `"Account"` default

---

## Remaining Backlog (Medium / Low Priority)

Items identified in audit but not yet implemented.

| #   | Item                                                                                     | Priority | Notes                                 |
| --- | ---------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| 1   | Add BreadcrumbList JSON-LD to more pages (features, mentorship, blog, help)              | Medium   | Currently only on course detail       |
| 2   | Add `loading.tsx` for public pages (course detail, about, blog, contact, help, features) | Medium   | Improves Core Web Vitals (LCP/CLS)    |
| 3   | Convert footer `<a>` tags to Next.js `<Link>` for internal links                         | Low      | Full page reloads on footer nav       |
| 4   | Add OpenGraph config to `/terms` and `/privacy` layouts                                  | Low      | Currently have title+description only |
| 5   | Add metadata to `/group/[inviteCode]` page (public invite link)                          | Low      | Currently no metadata at all          |
| 6   | Add metadata to `/apply` and `/apply/settings` pages                                     | Low      | Currently no metadata                 |

---

## Blog CMS Integration (Completed — April 2026)

- Integrated CMS for blog content management
- First blog post published
- Blog is no longer placeholder content

---

## File Inventory

### New files created in Phase 3:

- `app/(auth)/new-password/layout.tsx`
- `app/(auth)/verify/layout.tsx`
- `app/(root)/mentorship/checkout/layout.tsx`

### Files modified in Phase 3:

- `app/page.tsx` — added metadata export + EducationalOrganization JSON-LD
- `app/layout.tsx` — added X/Twitter to sameAs
- `app/(root)/about/page.tsx` — CyberLearn → PalmTechnIQ
- `app/(root)/partners/page.tsx` — CyberLearn → PalmTechnIQ (3 instances)
- `app/(root)/press/page.tsx` — CyberLearn → PalmTechnIQ (8 instances)
- `app/(root)/help/layout.tsx` — added FAQPage JSON-LD
- `app/(root)/courses/[courseId]/page.tsx` — added datePublished/dateModified to JSON-LD, fixed OG type
- `components/hero-section.tsx` — h3 → h2
- `app/(auth)/layout.tsx` — title template instead of static "Sign In"
- `app/(auth)/login/page.tsx` — added metadata
- `app/(auth)/signup/page.tsx` — added metadata
- `app/(auth)/forgot-password/page.tsx` — added metadata
- `app/(root)/enroll/page.tsx` — added canonical + OG
- `app/(root)/enroll/verify/page.tsx` — added noindex
- `app/(root)/courses/[courseId]/checkout/page.tsx` — added noindex metadata
- `app/(root)/courses/verify-course-payment/page.tsx` — added noindex metadata
- `app/(root)/mentorship/verify-payment/page.tsx` — added noindex metadata
