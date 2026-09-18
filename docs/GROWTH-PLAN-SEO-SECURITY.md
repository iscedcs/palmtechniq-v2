# PalmTechnIQ — SEO, Traffic & Security Implementation Plan

**Date:** 2026-09-18
**Status:** Plan, agreed scope pending
**Audit basis:** live `palmtechniq.com` (robots, sitemap, homepage, blog) plus the repo at `feat/exam-center`

---

## 1. The diagnosis, before the plan

Corrected against real Search Console data on 2026-09-18. An earlier draft of
this document claimed the site was "not indexed", based on a `site:` query
through a US-only search tool that returned unrelated domains. That was bad
evidence and the conclusion was wrong. Search Console says otherwise:

| Signal | Value |
|---|---|
| Indexed pages | **30** (climbing since late August) |
| Not indexed | **45**, across 6 reasons |
| Sitemap submitted | `https://www.palmtechniq.com/sitemap.xml` |
| Sitemap **last read** | **30 Dec 2025** — roughly nine months ago |
| **Discovered pages** | **11**, from a file containing **75** |
| Average position | **15** |
| Clicks (28 days) | **0**, from 10 impressions |

### The actual problem

**The site ranks at position 15 — page two — with a stale, self-contradicting
sitemap.** That is a much better starting point than invisibility, and a
different fix.

Two concrete faults, both now addressed:

**1. Host mismatch.** The sitemap is served on `www` but every URL inside it was
non-`www`, because the domain was hardcoded in 62 places across 40 files. Google
fetched a www sitemap full of cross-host URLs, discovered 11 of 75, and stopped
re-reading it. Both spellings also resolved, splitting ranking signals in two.

**2. Position 15 gets zero clicks.** This is normal — almost nobody reaches page
two. Moving from 15 to the top 10 is worth more than any amount of new
technical work, and that is a content and relevance problem, not a tags problem.

### What is already right (do not re-do this work)

The technical foundation is in better shape than the results suggest:

| Check | Status |
|---|---|
| `robots.txt` serving, crawlable | ✅ correct, allows `/`, blocks only private areas |
| `sitemap.xml` | ✅ valid XML, 76 URLs, consistent non-www |
| `news-sitemap.xml`, `rss.xml` | ✅ present |
| Root metadata, title template, keywords | ✅ rich and well-written |
| Google + Yandex verification tokens | ✅ present in `app/layout.tsx` |
| OG / Twitter images | ✅ generated (`opengraph-image.tsx`) |
| `robots: { index: true, follow: true }` | ✅ correct, nothing is accidentally `noindex` |
| Some JSON-LD | ✅ on 6 files |

So nothing is *blocking* Google. Google can crawl the site fine. It is choosing
not to index it — which in Search Console shows as **"Discovered – currently not
indexed"** or **"Crawled – currently not indexed"**.

### Why Google is declining to index

Three causes, in order of impact:

**1. There is almost nothing to index.** 76 URLs total, of which most are UI
shells (`/login`, `/enroll`, `/help`). The blog has **5 posts**, newest dated
**May 5** — over four months stale. Google does not rank domains that publish
five times and stop.

**2. The content that exists is not written for search.** The homepage H1 is
*"Learn. Create. Dominate."* — a brand slogan. Nobody types that into Google.
The page is ~1,200 words of short marketing phrases, not prose that answers a
question. There is no page on the site targeting a phrase a real person searches,
like *"how much does it cost to learn tailoring in Lagos"*.

**3. No authority.** A young domain with no inbound links has no reason to be
trusted. Indexing is competitive; Google spends crawl budget where there is
signal.

### The honest timeline

SEO will not produce calls this month. Realistically: **4–8 weeks to get indexed
and ranking for brand plus long-tail terms, 3–6 months for competitive terms.**

That is why §6 exists — the fastest revenue lever available right now is not SEO.

---

## 2. Phase 0 — Confirm the basics (this week, hours not days)

These are quick and must happen before anything else, because they decide whether
any later work is even measurable.

| # | Task | Why it matters |
|---|---|---|
| 0.1 | In Search Console, confirm which property is verified: `palmtechniq.com`, `www.palmtechniq.com`, or a **Domain property**. Use a **Domain property** — it covers both. | If the verified property is a variant the site does not serve, GSC will correctly show zero data forever. This alone can explain "no activity". |
| 0.2 | Submit all three sitemaps in GSC and record the "Discovered URLs" count. | Confirms Google is reading them. |
| 0.3 | Run **URL Inspection** on the homepage and 5 key pages. Record the exact verdict. | This tells us *why* Google declined — the fix differs for "Discovered" vs "Crawled" vs "Duplicate, Google chose different canonical". |
| 0.4 | Click **Request Indexing** on the top 10 URLs. | Free, immediate, and forces a decision. |
| 0.5 | Decide **www or non-www** and enforce a 301 in one direction. | The repo is inconsistent: 49 references to `https://palmtechniq.com`, 17 to `https://www.palmtechniq.com`. Split signals dilute both. |
| 0.6 | Set up **Bing Webmaster Tools** (imports from GSC in two clicks). | Bing also feeds ChatGPT search. Free traffic nobody competes for. |
| 0.7 | Create a **Google Business Profile** for the Festac Town address. | Ranks for "training centre near me" in days, not months, and drives *phone calls* — the thing actually being asked for. |

**0.5 is a code change**, the rest are console work. Everything else in this plan
is worth less until 0.1–0.4 tell us what Google actually thinks.

---

## 3. Phase 1 — Technical SEO gaps

Real gaps found in the repo, in priority order.

### 1.1 Per-page metadata — the biggest technical gap
**93 of 101 pages have no unique title or description.** Only 8 use
`generateMetadata`. Everything else inherits the root template, so dozens of
pages compete with identical descriptions.

Public pages currently missing metadata include `/about`, `/contact`, `/blog`
(the blog index itself), `/careers`, `/become-a-tutor`, `/partners`, `/press`,
`/privacy`, `/terms`, `/faq`, `/bootcamp`.

- [ ] Unique `title` (50–60 chars) and `description` (140–160 chars) on every
      public page, each containing its target phrase
- [ ] Explicit `alternates.canonical` per page
- [ ] `openGraph` per page, so shares in WhatsApp and LinkedIn look right

### 1.2 Structured data (JSON-LD)
Present on 6 files; should be on every page type. This is what earns rich
results — star ratings, prices, FAQ dropdowns, breadcrumbs — which lift
click-through even at the same ranking position.

- [ ] `Organization` + `logo` + `sameAs` (site-wide) — likely partly present, verify
- [ ] `WebSite` + `SearchAction` (sitelinks search box)
- [ ] **`Course`** on every course page — `provider`, `offers`, `aggregateRating`,
      `hasCourseInstance`. This is the highest-value one for an edtech site.
- [ ] `BreadcrumbList` on all nested pages
- [ ] `FAQPage` on `/faq`, `/help`, and each course page
- [ ] `Article` / `BlogPosting` with `author`, `datePublished`, `dateModified`
- [ ] `Review` where testimonials appear
- [ ] Validate every type in Google's Rich Results Test

### 1.3 Indexability and performance
- [ ] Audit `export const dynamic = "force-dynamic"` across public pages. Marketing
      and course pages should be static or ISR — faster, cheaper, better crawled.
      (Dashboards correctly stay dynamic.)
- [ ] Core Web Vitals pass on mobile: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] `next/image` everywhere, with width/height to stop layout shift.
      Note `next.config.mjs` sets `images.unoptimized: true` — this disables
      Next's image optimisation entirely and is likely costing LCP. Revisit.
- [ ] Descriptive `alt` text on every meaningful image (accessibility *and* image search)
- [ ] One `<h1>` per page, containing the target phrase; logical `h2`/`h3` beneath

### 1.4 Internal linking
Currently weak — a crawler landing on the homepage cannot reach much.
- [ ] Breadcrumbs on every nested page
- [ ] Related-courses block on each course page
- [ ] Related-posts block on each blog post
- [ ] Footer links to the main category pages
- [ ] Every new blog post links to at least two course pages (this is how blog
      traffic becomes enrolments rather than bounces)

---

## 4. Phase 2 — Keyword strategy and content

**This is the phase that actually moves rankings.** Everything in Phase 1 is
necessary and insufficient.

### 4.1 Do the keyword research properly
I deliberately have not invented search volumes — the search tooling available to
me is US-only, and Nigeria-specific volumes are exactly what matters here. Guessed
numbers would be worse than none.

- [ ] Google Keyword Planner with **location set to Nigeria**, and Lagos
- [ ] Mine GSC "Queries" once impressions appear — real demand, already yours
- [ ] Mine the site's own search box logs for what visitors type
- [ ] Check what competitors rank for (Utiva, AltSchool Africa, Semicolon,
      Decagon, Tech4Dev) — their ranking pages are a free keyword list

### 4.2 The keyword *shape* to target
Do not chase head terms like "online courses" — unwinnable for a new domain.
Win the long tail, where intent is highest and competition lowest:

| Pattern | Example | Why |
|---|---|---|
| Skill + location | "tailoring school in Lagos" | Local intent, converts to calls |
| Skill + price | "cost of learning fashion design in Nigeria" | Buyer intent |
| Skill + duration | "how long does it take to learn web development" | Top-of-funnel, huge volume |
| Skill + outcome | "learn a skill and earn from home Nigeria" | Matches the actual value proposition |
| Career questions | "highest paying skills in Nigeria 2026" | Very high volume, links to courses |
| Comparison | "AltSchool vs PalmTechnIQ" | Bottom-funnel, high conversion |
| Beginner guides | "how to become a data analyst in Nigeria" | Pillar-page material |
| Certification | "is an online certificate valid in Nigeria" | Objection-handling |

### 4.3 Landing pages — the structural fix
Today one `/courses` page carries every category. That page cannot rank for
twenty different skills. It needs one page per intent:

- [ ] `/learn/[skill]` — a real page per skill (tailoring, catering, auto repair,
      web development, data analysis, cybersecurity, AI). 1,500+ words each:
      what it is, what you earn, how long it takes, curriculum, FAQs, testimonials, CTA.
- [ ] `/courses/category/[slug]` — exists; give it unique copy per category
- [ ] `/learn/[skill]/lagos` — location pages, only where the copy is genuinely
      different. Thin duplicated location pages are penalised; do this carefully.
- [ ] `/compare/[competitor]` — honest comparison pages
- [ ] `/free/[resource]` — free downloadable, captures email (feeds the campaigns
      already running)

### 4.4 Blog cadence
Five posts, none since May, is the single clearest signal to Google that the
site is dormant.

- [ ] **2–3 posts per week, without exception for 3 months.** Consistency matters
      more than length.
- [ ] Build **topic clusters**: one pillar page (~3,000 words) per skill, with
      6–10 supporting posts, all linking to the pillar and to the course page.
- [ ] Update the 5 existing posts — refresh, expand, set `dateModified`
- [ ] Every post: target phrase in title, H1, first 100 words, and one H2
- [ ] Every post ends with a CTA to a course or a call

**Suggested first 12 posts** (each targets a real question, each links to a course):
1. Highest-paying skills to learn in Nigeria in 2026
2. How much can a tailor earn in Lagos? (real numbers)
3. Learn a skill online vs. apprenticeship — which is faster?
4. How to turn your skill into income while keeping your job
5. Is an online certificate respected by Nigerian employers?
6. How long does it actually take to learn web development?
7. Free vs paid online courses in Nigeria — what's the difference?
8. How to choose a tech skill when you don't have a tech background
9. What tools do you need to start catering from home?
10. How to price your services when you're just starting out
11. Teaching online in Nigeria — how tutors on PalmTechnIQ earn
12. A week in the life of a PalmTechnIQ student

---

## 5. Phase 3 — Security hardening

Existing posture is decent: IP rate limiting, brute-force protection, an IP
blacklist, a CSP, and a prior assessment doc. Gaps found:

### 5.1 Content Security Policy
`next.config.mjs` currently allows `'unsafe-inline'` (×2) and `'unsafe-eval'`.
That substantially weakens the CSP against XSS — an injected script executes.

- [ ] Move to a **nonce-based CSP**, generated per request in `proxy.ts`
- [ ] Remove `'unsafe-eval'` (identify what needs it — usually a dev-only tool)
- [ ] Keep `'unsafe-inline'` only in `style-src` if unavoidable, never `script-src`
- [ ] Add `Strict-Transport-Security` with `preload`
- [ ] Add `Permissions-Policy` locking down camera, microphone, geolocation

### 5.2 Application security
- [ ] Rate-limit **every** mutating server action, not only auth. Payment,
      enrolment, review and contact endpoints are all abusable.
- [ ] CSRF review of server actions taking side-effectful input
- [ ] Verify every admin/tutor action re-checks authorisation server-side — the
      Exam Center work established that pattern (`requireEditableExam`); apply it
      consistently elsewhere
- [ ] Audit `revalidatePath`/cache for authenticated data leaking into shared caches
- [ ] Confirm Paystack webhooks verify the `x-paystack-signature` HMAC
- [ ] File upload limits: type, size, and virus posture
- [ ] Ensure error responses never leak stack traces in production

### 5.3 Data and dependencies
- [ ] Keep Trivy in CI (already in progress) and make it blocking
- [ ] Enable Dependabot or Renovate
- [ ] Secret scanning on the repo; rotate anything historically committed
- [ ] Confirm PII in logs is redacted (emails, phone numbers, tokens)
- [ ] Backup and restore drill for the Neon database — untested backups are not backups
- [ ] Document a breach response runbook

### 5.4 Known outstanding from earlier work
- [ ] `NEXT_PUBLIC_URL` is `http://localhost:2026` — every transactional email
      link points at localhost. **This breaks the email campaigns already running.**
      Highest-priority item in this document.

---

## 6. Phase 4 — What actually gets calls in the next 30 days

Stated plainly: **SEO is a 3–6 month investment.** If the goal is calls and
enrolments *this month*, these outrank everything above.

| Lever | Why it beats SEO short-term |
|---|---|
| **Google Business Profile** | Ranks locally within days. Has a call button. Free. |
| **Fix `NEXT_PUBLIC_URL`** | Campaign emails currently link to localhost — the funnel is broken at the last step |
| **Landing pages per campaign** | Email traffic is arriving already; sending it to a generic homepage wastes it |
| **WhatsApp click-to-chat** | In Nigeria, WhatsApp converts far better than a contact form |
| **Visible phone number** | "Get calls coming in" requires a number that is easy to find on every page |
| **Exit-intent / lead magnet** | Converts the traffic email campaigns are already producing |
| **Retargeting pixel** | Meta pixel is configured; use it on people who already visited |
| **Testimonials with real names, photos, outcomes** | Objection-handling; also feeds `Review` structured data |

The email campaigns are the strongest asset right now — people are opening and
reading. The bottleneck is what happens *after* the click, and one of those links
currently points at `localhost:2026`.

---

## 7. Measurement

Without this, none of the above can be judged.

- [ ] GSC: impressions, clicks, average position, indexed page count — weekly
- [ ] GA4: organic sessions, conversion rate, top landing pages
- [ ] Track as conversions: enrolment started, enrolment paid, contact form,
      WhatsApp click, phone click
- [ ] Rank tracking for the top 20 target phrases
- [ ] One dashboard, reviewed weekly

**Success at 30 days:** indexed page count > 60, first impressions in GSC, GBP live.
**Success at 90 days:** 500+ organic sessions/month, ranking top-10 for 10+ long-tail phrases.

---

## 8. Sequencing

| When | Focus |
|---|---|
| **Week 1** | Phase 0 entirely. Fix `NEXT_PUBLIC_URL`. Fix www/non-www. GBP submitted. |
| **Week 2** | Phase 1.1 metadata across all public pages; Phase 1.2 `Course` + `Organization` JSON-LD |
| **Week 3** | Keyword research done properly; first 4 blog posts; WhatsApp + phone CTAs |
| **Week 4** | First 3 `/learn/[skill]` landing pages; internal linking; CSP nonces |
| **Month 2** | Blog cadence 2–3/week; remaining skill pages; rest of Phase 3 security |
| **Month 3** | Pillar pages; comparison pages; backlinks and directories; review and adjust |

---

## 9. Decisions — settled 2026-09-18

1. **Canonical host: `www`.** Implemented — `lib/site.ts` is now the single
   source of truth, all 33 code files canonicalised, and a 301 from the bare
   domain added in `next.config.mjs`.
2. **Content is written in-house.** The plan's engine is 2–3 posts per week.
3. **Demand is concentrated, and the landing pages should follow it.** Actual
   enrolments so far cluster around:
   - **Cybersecurity — the clear leader.** Build this page first, and the deepest.
   - **Web development** — front-end and full-stack
   - **Digital marketing** — emerging
   This changes §4.3: build `/learn/cybersecurity` first, not a broad spread of
   vocational skills. Write for where the money already is.
4. **Google Business Profile: the Festac Town address is usable and is not yet
   listed.** Creating it is the single fastest lever for phone calls.
5. **Scope: everything, in the order written.**

### What this means for the keyword strategy

§4.2's vocational examples (tailoring, catering, auto repair) were written before
the enrolment data was known. They stay as a long-term bet, but the near-term
targets should be cybersecurity-led:

- "cybersecurity course in Nigeria" / "in Lagos"
- "how to become a cybersecurity analyst in Nigeria"
- "cybersecurity certification cost Nigeria"
- "is cybersecurity a good career in Nigeria"
- "ethical hacking course Lagos"
- "cybersecurity bootcamp Nigeria"
- "learn cybersecurity with no IT background"
- "cybersecurity salary in Nigeria"
- plus the equivalent set for front-end / full-stack and digital marketing

The Exam Center already holds a 100-question ethical hacking bank. A free
"test your cybersecurity knowledge" quiz built on it is both a genuine lead
magnet and exactly the kind of interactive page that earns links.
