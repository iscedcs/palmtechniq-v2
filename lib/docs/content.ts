import type { DocPage, DocSection } from "./types";

export const DOC_VERSION = "2026.08.16";

export const docSections: DocSection[] = [
  // ─── GETTING STARTED ─────────────────────────────────────
  {
    title: "Getting Started",
    slug: "getting-started",
    icon: "Rocket",
    children: [
      {
        title: "Introduction",
        slug: "introduction",
        description:
          "Hands, technology and mind — what PalmTechnIQ is for, and who it is for.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Welcome to PalmTechnIQ

<version>${DOC_VERSION}</version>

**Palm** — your hands. **Tech** — technology. **IQ** — your mind. The name is
the idea: what you can make when you put the three together.

PalmTechnIQ is a place where anyone with a skill worth passing on can teach it,
and anyone who wants that skill can learn it. A tailor showing how to thread a
needle and finish a hem. A mechanic walking through servicing an engine. A
caterer, a photographer, a data scientist, a developer. The platform does not
care whether the skill is learned in a workshop or a lecture hall, only that
someone knows it well enough to teach it, and someone else wants it.

The point is that **everybody earns**. The tailor earns from what she already
knows. The student earns from what she learns next. Skill has always been
worth money; what has been missing is a way to package it, price it, sell it
and get paid, without needing an institution behind you.

## Closing the gap between learner and teacher

Most of the distance between the two is practical, so that is what the platform
removes.

**For the person teaching** — no studio, no company, no gatekeeper. Publish a
course, price it, and get paid to a Nigerian bank account. Bundle several
courses together, run a group deal, share a referral link that doubles your
share. Every sale is itemised so you can see exactly what you earned and why.

**For the person learning** — you can see what you are buying before you pay,
and get real value for the money: structured lessons, hands-on projects, an AI
assistant sitting with you inside the lesson when you get stuck, 1-on-1
mentorship when you need a person instead, proctored exams, and a certificate
anyone can verify without an account.

An AI advisor helps before any of that, if you are not sure which track fits.

## What is on the platform

**Four ways to learn.** Self-paced **courses**; multi-month **professional
programs** taught in cohorts with installment plans; 1-on-1 **mentorship**; and
seasonal **bootcamps**. Reinforced with quizzes, projects and tasks, and a
proctored **Exam Center** with question banks, auto-grading and live
invigilation.

**Four ways to buy.** Individually, as a tutor-curated **bundle** at a single
reviewed price, as a **group** where the leader earns course credit, or as a
program in **two installments**.

**Paid properly.** Revenue share that depends on who drove the sale, earnings
tracked per sale, withdrawal to a bank account via Paystack, and a ledger that
reconciles against the balance it explains.

## Who Is This For?

PalmTechnIQ serves multiple audiences:

| Audience | What You Get |
|----------|-------------|
| **Learners** | Take courses, programs and bootcamps, get mentorship, sit exams, complete projects, earn verifiable certificates |
| **Tutors** | Anyone with a skill worth teaching. Publish courses, package bundles, run group deals and flash sales, author exams, lead cohorts, earn and withdraw |
| **Mentors** | Run 1-on-1 sessions at your own rate, sell session packages, automatic Zoom links, paid on confirmation |
| **Admins** | Review applications and bundles, staff cohorts and release instructor earnings, oversee transactions, payouts and content |
| **Testers** | Documentation and pre-release access |
| **Superiors** | Manage tester accounts and testing operations |

Roles are not exclusive, and are not meant to be. The tailor teaching hemming
may be the student learning bookkeeping next month. Someone who arrives to
learn often ends up teaching — that is the intended direction of travel, not an
edge case.

## Key Features

### Learning
- **Courses** — Modules, lessons, quizzes, projects and tasks, with progress tracking
- **Professional Programs** — Cohort-based, multi-month, full or two-installment payment
- **Mentorship** — Instant booking or request-first, multi-session packages, Zoom created automatically
- **Bootcamps** — Seasonal intensives with tracks, tiers and teams
- **Exam Center** — Server-authoritative attempts, reusable question banks with spreadsheet import, auto-grading, controlled results release, live invigilation
- **Certificates** — Publicly verifiable, no account needed to check one

### Selling
- **Payments** — Paystack, with VAT handled and revenue split at settlement
- **Revenue Sharing** — The rate follows who drove the sale; one module is the source of truth
- **Course Bundles** — Several courses at one price, capped discount, platform-reviewed
- **Group Buying** — Tutor-configured tiers; the group leader earns spendable course credit
- **Referrals** — Every tutor gets a link that doubles their share, remembered for 30 days
- **Promotions** — Flash sales and promo codes, platform- or instructor-funded
- **Wallets & Payouts** — Ledgered balances, bank withdrawal via Paystack transfers

### Around it
- **AI Advisor** — Guides prospects to the right track and captures the lead
- **Lesson Assistant** — In-context help while studying
- **Blog & CMS** — Sanity-backed, with views, likes, bookmarks and comments
- **Search, reviews, discussions, wishlists and cart**
- **Notifications** — In-app and email
- **SEO** — Dynamic OG images, structured data, sitemaps, RSS

### Underneath
- **Roles & permissions** enforced in middleware *and* in every action
- **Scheduled sweeps** that recover payments taken but never settled, and close expired exams
- **Security** — IP rate limiting, brute-force protection, signed webhooks

## Documentation Structure

Pages are tagged by audience, so you can read the parts meant for you:

| Section | What is in it |
|---|---|
| **Getting Started** | Install, configure and run the platform |
| **Features** | How each capability works, for users and engineers alike |
| **User Guide** | Task-focused walkthroughs for students, tutors and admins |
| **Architecture** | Tech stack, the 97-model schema, roles, integrations, layout |
| **API Reference** | Server actions and every REST endpoint with its auth mode |
| **Development** | Analytics, background jobs, security, SEO, deployment |

Use the sidebar to navigate, or the search bar to jump straight to a topic.

> Where a page describes something that does not work as intended, it says so
> rather than describing the intent. If you find documentation that disagrees
> with the code, treat the code as the truth and fix the page.
`,
      },
      {
        title: "Installation",
        slug: "installation",
        description:
          "Set up the PalmTechnIQ development environment from scratch.",
        audience: "developer",
        lastUpdated: "2026-08-16",
        content: `
# Installation

PalmTechnIQ is built on Next.js 15 with React 19 and requires a few tools to get started.

## Prerequisites

- **Node.js** 18 or higher
- **pnpm** package manager (\`npm install -g pnpm\`)
- **PostgreSQL** database (we use [Neon](https://neon.tech) serverless Postgres)
- **Git** for version control

## Clone and Install

\`\`\`bash
git clone <repository-url>
cd palmtechniq-v2
pnpm install
\`\`\`

## Environment Variables

Create a \`.env\` file in the root directory with the following variables:

\`\`\`env
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:2026"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Paystack
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."

# Zoom (Server-to-Server OAuth)
ZOOM_ACCOUNT_ID="..."
ZOOM_CLIENT_ID="..."
ZOOM_CLIENT_SECRET="..."

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID="..."
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Analytics
NEXT_PUBLIC_GA_ID="G-..."
NEXT_PUBLIC_FACEBOOK_PIXEL_ID="..."
NEXT_PUBLIC_MIXPANEL_TOKEN="..."

# Upload
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# Mailing Integration (isce-mail sync)
MAILING_SYNC_API_KEY="<generated-hex-key>"
MAILING_SYNC_API_KEY_PREVIOUS="<previous-hex-key-for-rotation>"
# Optional: restrict to specific IPs (comma-separated)
# MAILING_SYNC_ALLOWED_IPS="1.2.3.4,5.6.7.8"
\`\`\`

## Database Setup

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
\`\`\`

## Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

The app will be available at \`http://localhost:2026\`.

## Build for Production

\`\`\`bash
pnpm build
pnpm start
\`\`\`
`,
      },
      {
        title: "Quick Start",
        slug: "quick-start",
        description: "Get up and running with PalmTechnIQ in 5 minutes.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# Quick Start

Get up and running quickly depending on your role.

## For Students

1. **Sign up** at the homepage or \`/signup\`
2. **Browse courses** at \`/courses\` — filter by category, level, or price
3. **Enroll** in a course — pay via Paystack or join a group purchase for discounts
4. **Start learning** — watch video lessons, complete quizzes, and submit tasks
5. **Earn your certificate** — complete all modules and the capstone project

## For Tutors

1. **Apply** to become a tutor at \`/become-a-tutor\`
2. **Wait for approval** — an admin will review your application
3. **Create your first course** at \`/tutor/courses/create\`
4. **Add modules and lessons** — include video content, quizzes, and tasks
5. **Publish** — your course will appear in the marketplace
6. **Track earnings** in your wallet at \`/tutor/wallet\`

## For Mentors

1. **Create mentorship offerings** linked to your courses
2. **Set availability** and pricing for sessions
3. **Accept or reject** session requests (REQUEST mode)
4. **Conduct sessions** via auto-generated Zoom meetings
5. **Track earnings** in your wallet

## For Developers

1. Clone the repository and install dependencies (see [Installation](/documentation/getting-started/installation))
2. Set up your \`.env\` file with required credentials
3. Run \`pnpm dev\` to start the development server
4. Explore the codebase — key directories:
   - \`app/\` — Next.js routes and pages
   - \`actions/\` — Server actions for data mutations
   - \`components/\` — React components
   - \`lib/\` — Utilities, integrations, and helpers
   - \`prisma/\` — Database schema and migrations

## For Admins

1. Log in with an admin account
2. Navigate to \`/admin\` for the dashboard
3. Review tutor applications at \`/admin/applications\`
4. Manage courses, users, and finances from the sidebar

## For Testers

1. Receive an email invitation from a Superior user
2. Log in with the temporary credentials provided
3. **Change your password** — you'll be redirected to \`/change-password\` on first login
4. Access the documentation at \`/documentation\`
5. Test platform features and report issues

## For Superiors

1. Log in with your Superior account
2. Navigate to \`/superior\` for your dashboard
3. Manage testers at \`/superior/testers\`
4. Add new testers by email — they'll receive an invite with temporary credentials
5. Resend invitations or remove testers as needed
6. Access the documentation at \`/documentation\`
`,
      },
      {
        title: "Configuration",
        slug: "configuration",
        description: "Configure the platform settings and integrations.",
        audience: "developer",
        lastUpdated: "2026-04-17",
        content: `
# Configuration

PalmTechnIQ uses environment variables and configuration files to manage settings across different environments.

## Next.js Configuration

The \`next.config.mjs\` file handles:
- **Security Headers** — Content Security Policy (CSP), X-Frame-Options, etc.
- **Image Domains** — Whitelisted domains for next/image
- **Redirects** — URL redirect rules
- **Webpack Customizations** — Custom build configurations

## Authentication (NextAuth)

Authentication is configured in two files:
- \`auth.config.ts\` — Edge-safe configuration (credentials + Google/GitHub OAuth)
- \`auth.ts\` — Full configuration with Prisma adapter, JWT callbacks, and session management

### Supported Providers
- **Credentials** — Email/password with bcrypt hashing
- **Google OAuth** — Social login via Google
- **GitHub OAuth** — Social login via GitHub

### Session Strategy
- JWT-based sessions (not database sessions)
- Tokens contain: userId, role, name, email, avatar, mustChangePassword
- Forced password change: Users with \`mustChangePassword: true\` are redirected to \`/change-password\` on login

## Tailwind CSS

The \`tailwind.config.ts\` defines the design system:
- **Dark mode** enabled via class strategy
- **Brand colors**: teal (\`#00343d\`), green (\`#27ba55\`), black, white
- **HSL-based** dynamic color system for theme support
- **Custom animations**: accordion, glow, float, slide-in

## Shadcn/UI Components

Configured via \`components.json\`:
- Style: \`default\`
- Base color: \`neutral\`
- CSS variables enabled
- Icon library: \`lucide\`
- RSC (React Server Components) enabled

## Sanity CMS

Blog content is managed via Sanity:
- Studio available at \`/studio\`
- Schemas defined in \`sanity/\` directory
- Queries in \`lib/sanity-queries.ts\`

## Blog SEO Fields — Editor Checklist

Every post has an optional **SEO** section in the Sanity Studio. Fill it in before publishing to maximise search visibility.

| Field | Guidance |
|---|---|
| **Meta Title** | 50–60 characters. Put the focus keyword near the start. Don't just copy the post title — make it search-friendly. Example: *"Python for Beginners: Full Course Guide 2026"* |
| **Meta Description** | 140–160 characters. Summarise the post's value and include a soft call-to-action ("Learn how…", "Discover…"). Shown in Google snippets. |
| **Focus Keyword** | 2–4 word phrase readers would type into Google. Used in JSON-LD keywords and RSS feed. Example: *"python beginner course"* |
| **Canonical URL** | Leave blank for original posts. Only fill in when this post is syndicated from another site or has a permanent home elsewhere. |
| **Excerpt** | 1–2 sentence hook. Shown on blog cards, Open Graph previews, and as the meta-description fallback if Meta Description is left blank. |
| **Main Image Alt Text** | Describe the image naturally and include the focus keyword where it fits. Required for accessibility and image search. |
| **Categories** | Tag with at least one relevant category. Categories power the *Related Topics* chip links at the bottom of every post and enable \`/blog?topic=\` filtering. |

> **Quick rule of thumb:** if the SEO section is left empty the post still works — it falls back to the post title, excerpt, and first category. Filling it in unlocks richer snippets and better ranking signals.
`,
      },
    ],
  },

  // ─── FEATURES ─────────────────────────────────────────────
  {
    title: "Features",
    slug: "features",
    icon: "Layers",
    children: [
      {
        title: "Course Management",
        slug: "course-management",
        description:
          "How courses, modules, lessons, quizzes, and projects work.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# Course Management

Courses are the core of PalmTechnIQ. They follow a structured hierarchy designed for progressive learning.

## Course Structure

\`\`\`
Course
├── Module 1
│   ├── Lesson 1 (video)
│   ├── Lesson 2 (video)
│   ├── Quiz (gates progression)
│   └── Task (module submission)
├── Module 2
│   ├── Lesson 3
│   ├── Lesson 4
│   ├── Quiz
│   └── Task
└── Capstone Project (course-level)
\`\`\`

## Learning Path

1. **Lessons** — Video-based content with progress tracking
2. **Quizzes** — Lesson-gated assessments that unlock progression
3. **Tasks** — Module-level submissions reviewed by tutors
4. **Projects** — Course capstone projects demonstrating mastery
5. **Certificate** — Issued upon successful completion

## Course Levels

| Level | Description |
|-------|-------------|
| **Beginner** | No prerequisites, foundational concepts |
| **Intermediate** | Requires basic knowledge, builds on fundamentals |
| **Advanced** | Expert-level content, complex projects |

## Pricing

- **Base Price** — Original course price
- **Current Price** — Active price (may reflect discounts)
- **Flash Sales** — Time-limited promotional pricing
- **Group Buying** — Tiered discounts based on group size
- **Promo Codes** — Platform-wide or instructor-specific codes

## Course Status

Courses go through a lifecycle:

| Status | Description |
|--------|-------------|
| \`DRAFT\` | Being created, not visible to students |
| \`PUBLISHED\` | Live and available for enrollment |
| \`ARCHIVED\` | No longer accepting enrollments |

## For Developers

### Key Files
- \`actions/course.ts\` — Server actions for CRUD operations
- \`app/(root)/courses/\` — Course listing and detail pages
- \`app/(root)/tutor/courses/\` — Tutor course management
- \`components/course/\` — Course-related UI components

### Database Models
- \`Course\` — Main course entity
- \`CourseModule\` — Sections within a course
- \`Lesson\` — Individual video lessons
- \`Quiz\` / \`Question\` — Assessment system
- \`Task\` / \`TaskSubmission\` — Module assignments
- \`Project\` / \`Submission\` — Capstone projects
`,
      },
      {
        title: "Mentorship System",
        slug: "mentorship",
        description:
          "1-on-1 mentorship with instant and request-based booking.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# Mentorship System

The mentorship system connects students with experienced tutors for personalized 1-on-1 guidance via Zoom.

## How It Works

### For Tutors (Creating Offerings)
1. Navigate to \`/tutor/mentorship/schedule\`
2. Create a mentorship offering linked to a course
3. Set pricing, duration, and booking mode
4. Students can discover your offerings through the marketplace or course completion upsells

### For Students (Booking Sessions)
1. Browse mentorship offerings at \`/mentorship\`
2. Or get suggestions after completing a course
3. Choose a session and proceed based on the booking mode

## Booking Modes

### Instant Booking
- Student pays immediately
- Session is auto-scheduled
- Zoom meeting is created automatically
- No mentor approval needed

### Request-Based Booking
1. Student sends a request
2. Mentor reviews and approves/rejects
3. If approved, student receives payment link
4. After payment, Zoom meeting is auto-created
5. Both parties get email notifications

## Session Status Flow

\`\`\`
PENDING_MENTOR_REVIEW → SCHEDULED → IN_PROGRESS → COMPLETED
                     ↘ REJECTED
\`\`\`

## Virtual Sessions

- **Zoom Integration** — Server-to-Server OAuth for auto-creating meetings
- **Session Join Page** — Dedicated page at \`/mentorship/session/[id]\`
- **Meeting Details** — Join URL, password, and session info displayed
- **Course Suggestions** — Post-session upsell for related courses

## Revenue Split

| Recipient | Share |
|-----------|-------|
| Mentor/Tutor | 70% |
| Platform | 30% |

## For Developers

### Key Files
- \`lib/zoom-integration.ts\` — Zoom API wrapper
- \`lib/payments/finalizePaystack.ts\` — Payment finalization + Zoom meeting creation
- \`actions/tutor-actions.ts\` — Mentor approval/rejection actions
- \`app/(root)/mentorship/\` — Student-facing mentorship pages
- \`app/(root)/tutor/mentorship/\` — Tutor mentorship management

### API Endpoints
- \`POST /api/mentorship/offerings\` — Create/list offerings
- \`POST /api/mentorship/session\` — Create session
- \`POST /api/mentorship/proceed-payment\` — Process payment
- \`GET /api/mentorship/suggestions\` — Course upsell suggestions

### Database Model
The \`MentorshipSession\` model tracks:
- Linked course, student, and tutor
- Booking mode (INSTANT/REQUEST)
- Session status and metadata
- Zoom meeting details (URL, ID, password)
- Payment reference and amount
`,
      },
      {
        title: "Payment System",
        slug: "payments",
        description: "Paystack integration, pricing, splits, and promo codes.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Payment System

PalmTechnIQ uses Paystack for secure payment processing with support for multiple currencies and payment channels.

## Payment Flow

1. Student initiates checkout (course or mentorship)
2. Paystack payment popup is displayed
3. Student completes payment
4. Webhook confirms payment on backend
5. Enrollment/session is activated
6. Revenue is split between parties

## Revenue Split

The rate depends on **who drove the sale**, not on what was sold.

| Sale path | Tutor | Platform |
|---|---|---|
| Platform traffic (organic, platform promo) | 25% | 75% |
| Tutor's own referral link | 50% | 50% |
| Tutor's own promo code | 50% | 50% |
| Mentorship session | 70% | 30% |
| Professional program (lead instructor) | 25% of full price | 75% |

Splits are calculated on the **discounted, VAT-exclusive** amount. VAT (7.5%)
is added on top and belongs to FIRS — it is never part of anyone's share.

See **Revenue Sharing** for the full reference, including bundles and programs.

## Promotional Pricing

### Promo Codes
- **Platform codes** — Apply to all courses
- **Instructor codes** — Created by tutors for their courses
- Validated via \`/api/promos/validate\`
- Applied at checkout before payment

### Flash Sales
- Time-limited pricing set by tutors
- Start/end dates with discounted price
- Automatically reverts when expired

### Group Buying
- Invite-based group purchases at \`/group/[inviteCode]\`
- Tiers are configured **per course** by the tutor (\`GroupTier\`), not fixed
  platform-wide. Each tier sets a group size, a group price, and a cashback
  percentage.
- When the group fills, the group leader receives cashback as **course credit**,
  funded by the tutor's wallet. It is spendable on future purchases, not
  withdrawable as cash.

## Tax & VAT

- Automatic VAT calculation based on region
- Included in the final checkout amount
- Tracked per transaction

## For Developers

### Key Files
- \`lib/payments/revenue.ts\` — **single source of truth** for every rate and formula
- \`lib/payments/wallet.ts\` — credit/debit helpers; the only sanctioned way to move a balance
- \`lib/payments/finalizePaystack.ts\` — settlement: enrollments, earnings, wallet credits
- \`lib/payments/sweep.ts\` — recovers charges taken but never settled
- \`actions/checkout.ts\` — course checkout
- \`actions/bundles.ts\` — bundle lifecycle and checkout
- \`actions/program-earnings.ts\` — program accrual and release
- \`lib/payments/promo.ts\` — promo code validation
- \`lib/payments/pricing.ts\` — compatibility shim re-exporting from revenue.ts
- \`actions/paystack.ts\` — Paystack server actions

> Never hardcode a rate. Import a function from \`revenue.ts\`. A duplicated
> constant is survivable; duplicated arithmetic is not — a rate change once
> moved money at one number while recording another.

### Settlement is idempotent
\`finalizePaystackByReference\` returns early on an already-completed
transaction and re-verifies with Paystack otherwise, so it is safe to call
repeatedly. That is what makes the payment sweep safe to run every 15 minutes.

### Webhook
- Endpoint: \`/api/webhook\`
- Validates Paystack signature (HMAC SHA-512)
- Processes \`charge.success\` events
- Creates enrollments, activates sessions, sends notifications
`,
      },
      {
        title: "Revenue Sharing",
        slug: "revenue-sharing",
        description:
          "How money is split between tutors, mentors, instructors and the platform.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Revenue Sharing

Every rate on the platform lives in one file: \`lib/payments/revenue.ts\`. If a
number about money appears anywhere else — a component, an action, a marketing
page — it is either imported from there or it is a bug.

## The rule

> **The rate is determined by who drove the sale, not by what was sold.**

A bundle, a single course and a cart are all the same economic event if the
platform brought the student. Packaging does not change attribution.

## Course sales

| Sale path | Tutor | Platform |
|---|---|---|
| Organic / platform traffic | 25% | 75% |
| Platform promo code applied | 25% | 75% |
| **Tutor's own referral link** | **50%** | **50%** |
| Tutor's own (instructor) promo code | 50% | 50% |

Referral only counts when the referring tutor owns the course. A tutor's link
does not earn them a share of somebody else's catalogue.

## Mentorship

Flat **70% mentor / 30% platform**, with no VAT applied. Session price is
\`hourlyRate ÷ 60 × durationMinutes\`, clamped to 30–180 minutes. Multi-session
packages apply a discount (Starter 3 → 10%, Growth 5 → 18%).

## Professional programs

The lead instructor earns **25% of the program's \`fullPrice\`** — deliberately
not of \`installTotal\`. The installment surcharge is a financing fee that
compensates the platform for carrying credit risk, so it is not shared.

Programs differ from courses in one important way: **attribution does not exist
at payment time.** A cohort is staffed separately from when students pay. So
the share is:

1. **Accrued** as each installment is paid, in proportion to cash actually
   collected — never against money not yet received
2. **Held** until \`max(paidAt + 30 days, cohort start date)\` — the refund
   window protects against clawbacks, the start date protects against paying
   out a cohort cancelled for low enrolment
3. **Released** by an admin, who chooses the recipient and the timing. The
   amount was fixed at accrual and is not editable

Accrued money is recorded but is **not** in the instructor's spendable balance
until released.

### Worked example
A ₦350,000 program on the installment plan (\`installTotal\` ₦370,000):

| Installment | Collected | Instructor accrues |
|---|---|---|
| 1 of 2 | ₦259,000 | ₦61,250 |
| 2 of 2 | ₦111,000 | ₦26,250 |
| **total** | ₦370,000 | **₦87,500** = 25% × ₦350,000 |

## Bundles

Bundles carry **no rate of their own**. The bundle price is allocated across
its courses in proportion to their list prices, and each resulting line item is
attributed normally. See **Course Bundles**.

## VAT

7.5%, charged on the discounted subtotal and added on top. VAT belongs to FIRS
and is **never** part of anyone's share — splits are always calculated on the
VAT-exclusive amount.

Where a purchase has several line items, VAT is allocated across them
proportionally, with the last item absorbing the rounding remainder so the
parts always sum exactly to the whole.

## For Developers

### Never duplicate a rate
\`\`\`ts
import { REVENUE, computeCheckoutTotals } from "@/lib/payments/revenue";
\`\`\`

The module is **pure** — no \`db\` import, no \`"use server"\` — so client
components can import it for display and every function is testable without a
database.

### Applied rates are snapshots
\`TutorEarning.splitPercent\` and \`Transaction.tutorShareAmount\` record what
was actually applied. Changing a rate never rewrites earnings already recorded.

At settlement, \`splitPercent\` is **derived** from the amounts that moved
(\`tutorShareAmount / discountedPrice\`) rather than re-decided from the
scenario, so the ledger cannot disagree with the money.

### Money arithmetic
All computation happens in **integer kobo**, converting once on the way in and
once on the way out. Naira arithmetic accumulates binary floating-point error —
this is why a recorded split once read \`0.2500000484693853\`.

> Storage is still \`Float\` across the schema. The arithmetic is exact; the
> columns have not been migrated. Do not introduce new \`Float\` money columns.

### Tests
\`lib/payments/__tests__/revenue.test.ts\` covers the split matrix, promo
applicability, VAT allocation, bundle distribution and program allocation —
using strict equality, because "approximately correct" is the thing being
prevented.

\`\`\`bash
pnpm test
\`\`\`
`,
      },
      {
        title: "Course Bundles",
        slug: "course-bundles",
        description:
          "Tutors package several courses at one price, reviewed by the platform.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Course Bundles

A bundle is a curated, discounted, price-capped, **reviewed** set of one
tutor's courses sold at a single price.

## For Tutors

Create one at **/tutor/bundles** (also linked from My Courses).

1. Pick at least two of your **published** courses
2. Set a price — the form shows the list total and the lowest price allowed
3. Save as a draft, then **Submit for review**
4. Once approved, use **Referral Link** to share it

### Rules
- Minimum **2 courses**, all published and all yours
- Maximum discount **40%** off the summed list price, minimum ₦500
- Editing the **price or the courses** on an approved bundle sends it back for
  review and takes it off sale. Editing the title or description does not.

### Earnings
Bundles pay the **normal rates** — 25% on platform traffic, **50% when you
share your own referral link**. Use the Referral Link button rather than
copying the address bar; a bare link earns you 25%.

> Promo codes cannot be combined with a bundle price.

## For Admins

Review queue at **/admin/bundles**. Each bundle shows the list total, the
bundle price, the discount depth against the floor, and **trailing 90-day sales
and revenue per course**.

### What to look for
The tutor sets the price, but on a platform-attributed sale **the platform
absorbs 75% of the discount**. So the question is whether the bundle grows the
pie.

A bundle of a tutor's two strongest sellers discounts sales that were already
going to happen — pure cannibalisation. The screen flags this, but it is a
**prompt for judgement, not an automated block**: volumes shift, new courses
have no history, and legitimate track-based bundles would be wrongly rejected
by a hard threshold. Favour bundles pairing a strong seller with weaker
courses.

Rejections carry a note back to the tutor, who can edit and resubmit.

## For Developers

### Design
A bundle introduces **no new payment infrastructure**. The bundle price is
allocated across its courses and fed through the existing checkout, so
settlement, enrollment and earnings work unchanged — \`finalizePaystack\`
required no modification.

\`\`\`
/bundles/[slug]?ref=CODE
  → beginBundleCheckout(slug, ref)
      1. resolve bundle → courseIds
      2. re-validate every guard
      3. allocateBundlePrices() across courses
      4. existing attribution logic — no bundle branch
      5. Transaction + TransactionLineItem[] (same shape as a cart)
      6. Paystack
  → finalizePaystackByReference — unchanged
\`\`\`

### Price allocation
\`\`\`ts
itemPrice = (coursePrice / listSum) * bundlePrice
\`\`\`
Computed in integer kobo, with the remainder assigned to the **highest-priced**
course so the line items sum **exactly** to the bundle price. Checkout refuses
if they do not reconcile.

Per-course line items are deliberate: they preserve VAT granularity for FIRS
reporting and keep \`TutorEarning\` per course.

### Guards
Re-checked at create, update **and** checkout, because course prices and
publication state move independently of the bundle:

| Guard | Where |
|---|---|
| price ≥ 60% of list sum, ≥ ₦500 | create, update, checkout |
| ≥ 2 courses, no duplicates | create, update |
| every course \`PUBLISHED\` and owned by the tutor | create, update, checkout |
| \`APPROVED\` **and** \`isActive\` | checkout |
| student owns none of the courses | checkout |
| tutor cannot buy their own bundle | checkout |
| no promo code | checkout |
| line items reconcile to the bundle price | checkout |

\`reviewStatus\` and \`isActive\` are separate on purpose: the platform controls
approval, the tutor controls pause/resume, and collapsing them into one boolean
would let either override the other.

### Key files
- \`actions/bundles.ts\` — lifecycle, guards, checkout
- \`app/(root)/bundles/[slug]/\` — public landing (public route, carries \`?ref=\`)
- \`app/(root)/tutor/bundles/\` — create, edit, submit, share
- \`app/(root)/admin/bundles/\` — review queue
`,
      },
      {
        title: "Exam Center",
        slug: "exam-center",
        description:
          "Proctored exams, question banks, auto-grading and live invigilation.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Exam Center

A server-authoritative assessment system: tutors author exams, students sit
them under invigilation, and grading and release are controlled.

## For Tutors

### Question banks
Build reusable banks at **/tutor/question-banks**, or import them. The import
wizard accepts spreadsheet uploads and is tolerant of how people actually
write: it recognises the type labels tutors use in practice, not only the
canonical ones, and reads real answer-key columns.

### Authoring an exam
Compose from a bank or write questions directly. Sections can **draw** a number
of questions from a bank, so each candidate sits a different selection from the
same pool.

### Sitting and monitoring
**/tutor/exams/[examId]/monitor** shows attempts live, with integrity signals
surfaced as they happen. Grading queue at \`/grading\`, with explicit results
release — grades are not visible to students until released.

## For Students

Exams appear under **/student/exams**. The timer and scoring are
**server-authoritative**: the browser cannot change the clock or the result.
Answers submit as you go, so a closed laptop or lost connection does not lose
work.

If time runs out, the attempt is submitted for you — first by your own browser,
and as a backstop by a scheduled sweep.

## For Developers

### Server authority
Attempts are scored on the server. Lesson quizzes are too — a client-scored
quiz is not an assessment.

### The sweep
\`/api/cron/exam-sweep\` auto-submits expired attempts, closes finished exams
and marks no-shows. It is a **backstop**, not the primary mechanism: a
candidate's own browser submits when the clock runs out.

Every pass is idempotent, so a late run does the same work and a skipped run is
picked up by the next. Driven by \`.github/workflows/exam-sweep.yml\` every 5
minutes.

> GitHub scheduled workflows are best-effort and often drift 5–15 minutes. That
> is acceptable precisely because this is a backstop. Do not build anything
> requiring punctuality on top of it.

### Device locking
\`deviceLockToken\` binds an attempt to a browser. It is deliberately **not**
unique — a second legitimate attempt from the same browser must work.

### Key files
- \`lib/exam/publish.ts\` — publish pipeline and roster sync
- \`lib/exam/sweep.ts\` — expiry, closure, no-shows
- \`app/api/cron/exam-sweep/\` — scheduled endpoint
- \`scripts/verify-exam-*.ts\` — end-to-end verification scripts

\`\`\`bash
pnpm verify:exam
\`\`\`
`,
      },
      {
        title: "Wallets & Payouts",
        slug: "wallets",
        description:
          "How balances are held, recorded, reconciled and withdrawn.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Wallets & Payouts

Every user has a \`walletBalance\`. What it means depends on who they are.

## For Tutors and Mentors

Earnings land in your wallet as sales settle, and can be withdrawn to your bank
via Paystack once you have added your account details.

The wallet page shows four figures:

| Figure | Meaning |
|---|---|
| **Available balance** | Money you can withdraw now |
| **Total earnings** | Lifetime earnings that reached your wallet |
| **Pending payouts** | Withdrawals requested but not yet paid |
| **Accrued (awaiting release)** | Program earnings recorded but **not yet spendable** |

Accrued is deliberately separate. A program share is owed to you from the
moment a student pays, but it only becomes withdrawable after the refund window
and the cohort start — see **Revenue Sharing**.

## For Students

Students hold **course credit**, not cash. It comes from group-buying cashback
and is applied automatically at checkout, reducing what you pay. It cannot be
withdrawn — \`requestWithdrawal\` refuses non-tutor roles.

If you abandon a checkout that had credit applied, the credit is returned.

## For Developers

### The invariant
\`\`\`
walletBalance === sum(WalletEntry.amount)
\`\`\`

\`WalletEntry\` is an append-only, **signed** record of every balance change. It
answers a different question from \`TutorEarning\`: not "what did I earn and at
what rate" but "why is my balance this number" — including movements that are
not earnings at all.

### Always use the helpers
\`\`\`ts
import { creditWallet, debitWallet } from "@/lib/payments/wallet";

await creditWallet(tx, {
  userId, amount, type: "COURSE_EARNING", transactionId,
});
\`\`\`

They write the ledger entry in the **same transaction** as the balance change,
so the two cannot diverge. Updating \`walletBalance\` directly is how group
cashback once moved money on both sides while recording nothing — silently
creating ₦1,250 that took a manual audit to find.

> There should be no raw \`walletBalance: { increment }\` anywhere outside
> \`lib/payments/wallet.ts\`. If you add one, you have created a hole.

### Entry types
\`COURSE_EARNING\`, \`MENTORSHIP_EARNING\`, \`PROGRAM_EARNING_RELEASE\`,
\`GROUP_CASHBACK_CREDIT\`, \`GROUP_CASHBACK_DEBIT\`, \`WITHDRAWAL_REQUESTED\`,
\`WITHDRAWAL_REVERSED\`, \`COURSE_CREDIT_APPLIED\`, \`COURSE_CREDIT_REFUNDED\`,
\`ADJUSTMENT\`.

\`ADJUSTMENT\` is for opening balances and manual corrections only. No payment
path should ever write one.

### Reconciling
\`\`\`bash
pnpm tsx scripts/reconcile-wallets.ts
\`\`\`

Reports any wallet that disagrees with its ledger. The payment sweep also
counts drifting wallets on every run and logs an error if the count is not
zero — a non-zero result means a balance moved without a ledger entry, and that
needs looking at before it compounds.

Balances that predate the ledger were recorded as a single \`ADJUSTMENT\`
opening balance rather than reconstructed, because the movements they came from
were never recorded and inventing them would bury the discrepancy.

### Earning status
- \`PENDING\` — accrued, not spendable (programs only)
- \`AVAILABLE\` — in the wallet
- \`PAID\` — settled by a completed withdrawal, oldest first
- \`CANCELLED\` — voided by a refund before release
`,
      },
      {
        title: "Professional Programs",
        slug: "programs",
        description:
          "Cohort-based programs with installment plans and lead instructors.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Professional Programs

Programs are cohort-based, multi-month tracks — distinct from self-paced
courses. A student enrols in a **cohort**, pays in full or in two installments,
and is taught by a **lead instructor**.

## For Students

Enrol at **/enroll**. You choose a program, a cohort, and a payment plan.

### Paying in installments
Paying in two parts costs slightly more than paying in full — the difference is
a financing fee, shown before you commit.

| | Example |
|---|---|
| Full payment | ₦350,000 |
| Installment total | ₦370,000 |
| First payment (default 70%) | ₦259,000 |
| Balance, due mid-programme | ₦111,000 |

You may choose a larger first payment. The **minimum is 50%** of the
installment total, so the outstanding balance never exceeds what you have
already paid.

The balance is paid from **/student/programs** when it falls due.

## Cohorts

Cohorts are named on a fixed system — cycle number, year, quarter and a
phonetic label, for example **Cycle 42 · 26Q2 Delta**. Each has a seat limit
and an open/closed state.

## For Admins

Cohorts are staffed at **/admin/program-earnings**, where you assign the lead
instructor and later release their earnings. See **Revenue Sharing** for how
the 25% share accrues and when it can be released.

Enrolments and payment status are visible at **/admin/enrollments**.

## For Developers

### Payment shape
Programs deliberately do **not** flow through \`Transaction\` /
\`TransactionLineItem\`. They use \`ProgramEnrollment\` plus
\`InstallmentPayment\` rows and call Paystack directly.

> **Consequence:** program revenue does not appear in the admin transaction
> reports, and programs charge **no VAT** while courses charge 7.5%. Both are
> known gaps, not intentional design — see the implementation plan before
> assuming either is settled.

### Account provisioning
A student who pays without an account gets one created automatically on first
successful payment, with a password-reset link emailed to them. An existing
email is linked to the enrolment instead.

### Key files
- \`actions/enrollment.ts\` — enrolment, installment schedule, verification
- \`actions/program-balance-payment.ts\` — second installment
- \`actions/program-earnings.ts\` — accrual and release
- \`lib/cohort.ts\` — cohort naming and availability
- \`data/programs.ts\` — the program catalogue and pricing
`,
      },
      {
        title: "Bootcamp",
        slug: "bootcamp",
        description:
          "The seasonal bootcamp portal — tracks, tiers, teams and enrolment.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Bootcamp

A seasonal, standalone portal for intensive cohorts, with its own landing
experience separate from the main catalogue.

## Structure

| Model | What it is |
|---|---|
| \`Bootcamp\` | One season, e.g. "Summer Bootcamp 2026". Has a slug, dates, seat cap |
| \`BootcampTrack\` | A specialisation within a season |
| \`BootcampTier\` | A price tier / package for a track |
| \`BootcampEnrollment\` | A student's place, tied to a track and tier |
| \`BootcampTeam\` | Team formation for group work and hackathons |

A season is toggled with \`isActive\`, so an old bootcamp can be archived
without deleting its enrolments.

## Routing

The bootcamp lives in its own route group at \`app/bootcamp\`, separate from
\`app/(root)\`, so it can carry a distinct visual identity without inheriting
the main layout.

> It is currently a **single landing page**. Track pages, the enrolment flow
> and the team/hackathon surfaces described in the implementation plan are not
> yet built — see \`docs/implementation/bootcamp/implementation-plan.md\`.

## For Developers

Bootcamp enrolment does **not** currently share the course checkout pipeline,
so it does not produce \`Transaction\` rows, revenue splits or \`TutorEarning\`
records. If bootcamp is monetised through the platform, route it through the
existing checkout rather than adding a fourth payment path — the same argument
that kept course bundles from needing new payment infrastructure.
`,
      },
      {
        title: "AI Features",
        slug: "ai-features",
        description:
          "Course advisor, lesson chat, and personalised recommendations.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# AI Features

Three distinct AI surfaces, each with a different job.

## Course Advisor

A guided conversation that helps a prospective student choose a track, at
**/features/ai-interview** and on the bootcamp advisor CTA.

Conversations persist so they can be picked up later and reviewed by the team:

| Model | Purpose |
|---|---|
| \`AdvisorSession\` | One conversation, identified by a \`sessionToken\` so an anonymous visitor keeps their thread |
| \`AdvisorTurn\` | Individual messages |
| \`AdvisorRecommendation\` | Courses or programs the advisor suggested |
| \`AdvisorFollowUp\` | A captured lead, with status NEW → CONTACTED → CLOSED |

Admins work the resulting leads at **/admin/advisor**.

## Lesson Chat

An in-lesson assistant that answers questions in the context of the lesson the
student is currently on, at \`/api/lessons/[lessonId]/chat\`.

## Recommendations

\`AIRecommendation\` stores personalised course suggestions surfaced on the
student dashboard.

## For Developers

- \`lib/ai/course-advisor.ts\` — advisor prompt and flow
- \`lib/ai/lesson-chat.ts\` — lesson-scoped assistant
- \`app/api/advisor/chat\` — advisor endpoint, rate limited per session
- \`app/api/advisor/lead\` — lead capture

Both advisor endpoints are **rate limited in memory** with a per-key bucket.
That is per-instance, so it is a courtesy limit rather than a guarantee — a
multi-instance deployment needs a shared store (Redis is already available)
before it can be relied on.
`,
      },
      {
        title: "Certificates",
        slug: "certificates",
        description: "Issuing and publicly verifying completion certificates.",
        audience: "all",
        lastUpdated: "2026-08-14",
        content: `
# Certificates

## For Students

Complete a course and a certificate is issued to your account. Each carries a
unique code, and anyone can confirm it is genuine at **/verify-certificate**
without needing an account — useful when an employer asks.

## Verification

- Public page: \`/verify-certificate?code=<code>\`
- API: \`/api/certificates/verify\`
- Legacy \`/certificate/[id]\` links permanently redirect to the verification
  page, so certificates issued under the old scheme keep working

Verification is deliberately public and unauthenticated. A certificate nobody
outside the platform can check is not worth issuing.

## Volunteer Certificates

\`VolunteerCertificate\` covers certificates awarded outside course completion
— community and volunteer contributions — carried over from the previous
platform. Seeded via \`scripts/seed-volunteer-certificates.ts\` from a CSV
export.

## For Developers

- \`Certificate\` — issued on course completion, linked to user and course
- \`VolunteerCertificate\` — standalone, unique \`certCode\`
- Redirect configured in \`next.config.mjs\`

> Certificate codes appear in public URLs and are the only credential needed to
> view one. Keep them unguessable; do not switch them to sequential ids.
`,
      },
      {
        title: "User Management",
        slug: "user-management",
        description: "Roles, permissions, and user lifecycle.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# User Management

PalmTechnIQ supports multiple user roles with different access levels and capabilities.

## User Roles

| Role | Description | Dashboard |
|------|-------------|-----------|
| \`USER\` | Default role after signup | \`/courses\` |
| \`STUDENT\` | Enrolled in at least one course | \`/student\` |
| \`TUTOR\` | Approved course creator | \`/tutor\` |
| \`MENTOR\` | Approved mentorship provider | \`/mentor/mentorship\` |
| \`ADMIN\` | Platform administrator | \`/admin\` |
| \`TESTER\` | Invited tester with documentation access | \`/documentation\` |
| \`SUPERIOR\` | Manages testers and testing operations | \`/superior\` |

## Registration Flow

1. User signs up via email/password or Google/GitHub OAuth
2. Email verification sent via Resend
3. User starts as \`USER\` role
4. Role changes based on actions:
   - Enrolling in a course → \`STUDENT\`
   - Tutor application approved → \`TUTOR\`
   - Admin assignment → \`ADMIN\` or \`MENTOR\`
   - Invited by a Superior → \`TESTER\` (with temporary password)
   - Admin assignment → \`SUPERIOR\`

## Tester Invitation System

Superiors can invite testers to the platform through the \`/superior/testers\` dashboard:

1. **Superior adds a tester** — Enters name and email address
2. **Account is created** — A \`TESTER\` account with a temporary password
3. **Invite email sent** — The tester receives an email with login credentials
4. **Forced password change** — On first login, the tester must change their password
5. **Access granted** — After password change, the tester can access \`/documentation\`

### Superior Dashboard Features
- **Add Testers** — Create new tester accounts with email invitations
- **View All Testers** — See active testers, pending password changes, and login status
- **Resend Invitations** — Re-send invite emails for testers who haven't logged in
- **Remove Testers** — Delete tester accounts when access is no longer needed

## Forced Password Change

Users with \`mustChangePassword: true\` (e.g., newly invited testers) are:
1. Redirected to \`/change-password\` after login
2. Required to set a new password before accessing any other page
3. The middleware enforces this redirect on every route except \`/change-password\` itself

## User Profiles

### Student Profile
- Education level, interests, and goals
- Study tracking and rankings
- Course progress and certificates
- Mentorship history

### Tutor Profile
- Expertise areas and experience
- Rating and reviews
- Course catalog
- Earnings and wallet

## Authentication

- **JWT-based sessions** — No database session storage
- **Password hashing** — bcrypt with salt rounds
- **OAuth** — Google and GitHub sign-in supported
- **Email verification** — Required for full access
- **Forced password change** — Testers must change temporary password on first login

## For Developers

### Key Files
- \`auth.ts\` / \`auth.config.ts\` — Authentication configuration
- \`actions/auth.ts\` — Auth server actions (register, login, verify)
- \`actions/superior.ts\` — Tester management (add, remove, resend invite)
- \`actions/change-password.ts\` — Forced password change action
- \`actions/student-profile.ts\` — Student profile management
- \`actions/tutor-profile.ts\` — Tutor profile management
- \`app/(auth)/\` — Login, signup, and verification pages
- \`app/(root)/change-password/\` — Forced password change page
- \`app/(root)/superior/\` — Superior dashboard and tester management

### Session Data
JWT tokens include: \`userId\`, \`role\`, \`name\`, \`email\`, \`avatar\`, \`mustChangePassword\`

### Route Protection
Routes are categorized in \`routes.ts\`:
- \`publicRoutes\` — Accessible without login
- \`protectedRoutes\` — Require authentication
- \`adminRoutes\` — Require ADMIN role
- \`tutorRoutes\` — Require TUTOR role
- \`superiorRoutes\` — Require SUPERIOR role
- \`documentationRoutes\` — Require TESTER or SUPERIOR role
`,
      },
      {
        title: "Email Notifications",
        slug: "email-notifications",
        description: "Email templates and notification system.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# Email Notifications

PalmTechnIQ sends automated emails for key events using Resend as the email provider.

## Email Events

| Event | Recipient | Description |
|-------|-----------|-------------|
| Signup | User | Welcome email with verification link |
| Email Verification | User | Confirm email address |
| Password Reset | User | Reset password link |
| Tester Invitation | Tester | Login credentials and platform access instructions |
| Enrollment Confirmation | Student | Course enrollment details |
| Mentorship Request | Tutor | New session request notification |
| Mentorship Approved | Student | Session approved + payment link |
| Session Scheduled | Both | Zoom meeting details |
| Payment Receipt | Student | Transaction confirmation |
| Tutor Application | Admin | New tutor application |
| Application Status | Applicant | Approved/rejected notification |

## In-App Notifications

In addition to emails, the platform has a real-time notification system:
- Bell icon in the navigation bar
- Categorized notifications (enrollment, mentorship, payment, etc.)
- Read/unread status tracking
- Click-through to relevant pages

## For Developers

### Key Files
- \`lib/mail.ts\` — Email sending functions using Resend
- \`lib/email-templates/\` — HTML email templates
- \`lib/notifications/\` — In-app notification system
- \`lib/notify.ts\` — Notification utility functions
- \`app/api/notifications/\` — Notification API endpoints
`,
      },
      {
        title: "Admin Dashboard",
        slug: "admin-dashboard",
        description: "Admin features for managing the platform.",
        audience: "all",
        lastUpdated: "2026-04-17",
        content: `
# Admin Dashboard

The admin dashboard provides comprehensive platform management at \`/admin\`.

## Dashboard Overview

The main admin page shows:
- **Total users** — Active user count by role
- **Revenue** — Total and recent transaction data
- **Enrollment stats** — Active enrollments and trends
- **Course stats** — Published, draft, and archived courses

## Admin Sections

### Applications (\`/admin/applications\`)
- Review tutor/mentor applications
- Approve or reject with feedback
- View applicant profiles and qualifications

### Courses (\`/admin/courses\`)
- View all courses across the platform
- Manage course status (publish, archive)
- Review course content and quality

### Enrollments (\`/admin/enrollments\`)
- Track all student enrollments
- View enrollment trends and analytics
- Manage enrollment issues

### Finance (\`/admin/finance\`)
- Revenue breakdown by course, tutor, and period
- Transaction history and details
- Withdrawal request management
- Platform earnings tracking

### Promotions (\`/admin/promotions\`)
- Create platform-wide promo codes
- View active and expired promotions
- Track promo code usage and revenue impact

### Security (\`/admin/security\` — IP Brute Force Protection)
- View blocked IPs and locked accounts
- Unblock IPs and unlock accounts
- Login attempt audit trail
- Security configuration

### Mentorship (\`/admin/mentorship\`)
- Monitor active mentorship sessions
- Track mentor performance and earnings

### Analytics (\`/admin/analytics\`)
Comprehensive platform analytics dashboard with:

**Overview Cards:**
- Total events, active users, total revenue, total signups

**Dashboard Tabs:**

| Tab | What It Shows |
|-----|---------------|
| **Overview** | Activity timeline (area chart), event categories (pie chart), top events table |
| **Conversion Funnel** | Page views → course views → cart → checkout → enrollment |
| **Revenue** | Daily revenue breakdown, course vs. program revenue split |
| **Top Courses** | Course performance metrics, interaction breakdowns |
| **Live Activity** | Real-time event stream of user actions |

**Features:**
- Date range selector (7d, 30d, 90d, all-time)
- Device and browser breakdown
- Recent events display (last 50)
- Refresh button for real-time updates

> The \`/analytics\` shortcut route redirects to \`/admin/analytics\`.

## For Developers

### Key Files
- \`actions/admin-dashboard.ts\` — Dashboard data fetching
- \`actions/admin-applications.ts\` — Application management
- \`actions/admin-enrollments.ts\` — Enrollment management
- \`actions/analytics.ts\` — Analytics overview, funnel, revenue, timeline, top courses
- \`actions/security-admin.ts\` — Security admin functions
- \`lib/analytics/track.ts\` — Event tracking system (30+ platform events)
- \`lib/analytics/analytics-provider.tsx\` — Client-side analytics provider (GA4, Pixel, Mixpanel)
- \`data/tutor-analytics.ts\` — Tutor-specific analytics data fetcher
- \`app/(root)/admin/\` — Admin page components
- \`components/admin/\` — Admin-specific UI components
`,
      },
    ],
  },

  // ─── USER GUIDE ─────────────────────────────────────────
  {
    title: "User Guide",
    slug: "user-guide",
    icon: "Users",
    children: [
      {
        title: "Student Guide",
        slug: "student-guide",
        description: "Complete guide for students using the platform.",
        audience: "non-developer",
        lastUpdated: "2026-04-28",
        content: `
# Student Guide

Everything you need to know as a student on PalmTechnIQ.

## Getting Started

1. **Create an account** — Sign up with email or Google
2. **Verify your email** — Check your inbox for a verification link
3. **Complete your profile** — Add your education level, interests, and goals
4. **Browse courses** — Explore the catalog at \`/courses\`

## Enrolling in a Course

### Direct Purchase
1. Find a course you like
2. Click "Enroll Now"
3. Complete payment via Paystack
4. Start learning immediately

### Using a Promo Code
1. At checkout, enter your promo code
2. The discount will be applied automatically
3. Complete the discounted payment

### Group Purchase
1. Create or join a group purchase
2. Share the invite link with friends
3. Once the group threshold is met, everyone gets the discount
4. Complete payment with the group price

## Learning Experience

### Watching Lessons
- Video lessons play in the built-in player
- Progress is tracked automatically
- Mark lessons as complete to advance

### Taking Quizzes
- Quizzes appear after their associated lesson
- You must pass the quiz to unlock the next section
- Multiple attempts are allowed
- AI Coach provides feedback on your answers

### Submitting Tasks
- Tasks are module-level assignments
- Upload your submission for tutor review
- Receive grades and feedback from your tutor

### Capstone Projects
- Each course has a final capstone project
- Demonstrate your mastery of the course material
- Submit for review and grading

## Certificates

Upon completing all modules and the capstone project:
1. Your certificate is automatically generated
2. Access it at \`/student/profile\`
3. Share it on LinkedIn or download as PDF
4. Certificates are verifiable at \`/certificate/[id]\`

## Student Verification

Your student profile can be independently verified by anyone:
- **Public verification page** at \`/verify/student/[id]\`
- Displays your name, avatar, rank, and learning level
- Shows stats: member since, total points, courses started/completed
- Lists active enrollments
- Confirms your verified status (active/inactive)
- Share this link with employers, mentors, or institutions as proof of learning

## Mentorship

1. Browse available mentors at \`/mentorship\`
2. Choose a mentor and session type
3. Book instantly or send a request
4. Join the Zoom session at the scheduled time
5. Get personalized guidance and feedback

## Your Dashboard (\`/student\`)

- **My Courses** — All enrolled courses with progress
- **Assignments** — Pending and submitted tasks
- **Mentorship** — Upcoming and past sessions
- **Profile** — Update your details and preferences
- **Progress** — Overall learning analytics
- **Achievements** — View all unlocked milestones at \`/student/achievements\`

## Achievements & Streak Milestones

- Open your achievements page at \`/student/achievements\`
- Filter by type (Lessons, Quizzes, Courses, Skills)
- Search achievements by title or description
- Track rarity tiers (Common, Uncommon, Rare, Epic)
- Use streak milestones on the dashboard to stay motivated with target rewards
`,
      },
      {
        title: "Tutor Guide",
        slug: "tutor-guide",
        description: "Complete guide for tutors creating and managing courses.",
        audience: "non-developer",
        lastUpdated: "2026-08-14",
        content: `
# Tutor Guide

Everything you need to know as a tutor on PalmTechnIQ.

## Becoming a Tutor

1. Navigate to \`/become-a-tutor\`
2. Fill out the application form with your:
   - Professional background
   - Areas of expertise
   - Teaching experience
   - Sample content or portfolio
3. Submit your application
4. Wait for admin review and approval
5. Once approved, access your tutor dashboard at \`/tutor\`

## Creating a Course

### Step 1: Course Details
1. Go to \`/tutor/courses/create\`
2. Enter course title, description, and category
3. Set the difficulty level (Beginner/Intermediate/Advanced)
4. Upload a thumbnail image
5. Set pricing (base price and current price)

### Step 2: Add Modules
1. Create modules to organize your content
2. Each module represents a section of the course
3. Add a module description and learning objectives

### Step 3: Add Lessons
1. Add video lessons to each module
2. Upload or link video content
3. Set lesson duration and order
4. Add any supplementary materials

### Step 4: Add Assessments
1. **Quizzes** — Create lesson-gated quizzes with multiple-choice questions
2. **Tasks** — Add module-level assignments for students to submit
3. **Capstone Project** — Define the final project requirements

### Step 5: Publish
1. Review all content
2. Click "Publish" to make the course live
3. Your course will appear in the marketplace

## Managing Students

- View enrolled students at \`/tutor/students\`
- Review task submissions and provide feedback
- Grade capstone projects
- Respond to course discussions

## Mentorship

1. Create mentorship offerings at \`/tutor/mentorship/schedule\`
2. Link offerings to your courses
3. Set pricing and availability
4. Manage session requests (approve/reject)
5. Conduct sessions via Zoom

## Earnings & Wallet

- Track earnings at \`/tutor/wallet\`
- View transaction history
- Request withdrawals to your bank account
- Revenue split: **25%** of course sales driven by the platform, **50%** for
  students you bring yourself via your referral link (found on each course card
  and on the Bundles page). Mentorship sessions pay **70%**.

## Earn More With Your Referral Link

This is the single biggest lever on your earnings, and it is easy to miss.

- A student the **platform** sends you pays you **25%**
- A student **you** send, through your referral link, pays you **50%**

Your link is on every course card (**Referral Link**) and on the Bundles page.
Share that link — not the address bar — anywhere you already have an audience:
your bio, a WhatsApp group, a newsletter, a class. The rate doubles for the
same course and the same student.

The link is remembered for 30 days, so a student who clicks today and buys next
week still counts as yours.

## Course Bundles

Package several of your courses at one price. Students get a discount, you get
a bigger sale.

1. Go to **Bundles** (from My Courses, or the menu)
2. Pick at least two published courses
3. Set a price — the form shows the lowest allowed as you choose courses
4. Submit for review

The platform reviews bundles before they go live, usually looking at whether
the discount is deep enough to be worth it without simply discounting sales
that were already going to happen. If a bundle is sent back you will see the
reason and can edit and resubmit.

Once approved you get a **Referral Link** for the bundle — the same 50% rule
applies.

> Changing a live bundle's price or its courses sends it back for review and
> takes it off sale until approved again. Editing the title or description does
> not.

## Teaching a Program Cohort

Professional programs run as cohorts with a lead instructor. If you are
assigned as lead, you earn **25% of the program's full price**, accrued as each
student installment is paid.

Program earnings work differently from course sales: they appear as **Accrued
(awaiting release)** in your wallet first, and become withdrawable after the
refund window has passed and the cohort has started. This protects both sides —
you are not paid out of money that may still be refunded.

## Promotions

- Create promo codes for your courses
- Set discount percentage and expiration date
- Enable flash sales with time-limited pricing
- Track promo code usage

## Your Dashboard (\`/tutor\`)

- **Overview** — Earnings, enrollments, ratings at a glance
- **Courses** — Manage your course catalog
- **Mentorship** — View and manage sessions
- **Projects** — Review student project submissions
- **Reviews** — See student feedback and ratings
- **Wallet** — Earnings and withdrawal management
- **Analytics** — Detailed performance metrics (completed/pending revenue, completion rates, course earnings)
`,
      },
      {
        title: "Admin Guide",
        slug: "admin-guide",
        description: "Complete guide for platform administrators.",
        audience: "non-developer",
        lastUpdated: "2026-08-14",
        content: `
# Admin Guide

Platform administration guide for managing PalmTechnIQ.

## Accessing the Admin Panel

1. Log in with an admin account
2. Navigate to \`/admin\`
3. Use the sidebar to access different sections

## Key Responsibilities

### Reviewing Applications
1. Check \`/admin/applications\` for pending tutor applications
2. Review applicant qualifications and experience
3. Approve or reject with feedback
4. Approved applicants gain tutor access

### Managing Courses
1. Browse all courses at \`/admin/courses\`
2. Review course content and quality
3. Manage course status (publish, unpublish, archive)
4. Handle content disputes or quality issues

### Financial Management
1. View revenue dashboard at \`/admin/finance\`
2. Process withdrawal requests from tutors
3. Monitor transaction trends
4. Track platform earnings vs payouts

### User Management
1. View all users and their roles
2. Activate or deactivate accounts
3. Handle user complaints or issues

### Security Monitoring
1. Review login attempt logs
2. Manage blocked IPs (auto-blocked after 10 failed attempts)
3. Unlock accounts (auto-locked after 5 failed attempts per email)
4. Monitor for suspicious activity

### Promotions
1. Create platform-wide promo codes
2. Set discount amounts and expiration dates
3. Track usage and revenue impact

## Security Features

### IP-Based Brute Force Protection
- **10 failed login attempts** per IP → 1-hour block
- **5 failed attempts** per email → 15-minute account lock
- Automatic cleanup of old records
- Full audit trail in the database

### Admin Actions
| Action | Description |
|--------|-------------|
| View Dashboard | Overview of security status |
| Block IP | Manually block an IP address |
| Unblock IP | Remove an IP from the block list |
| View Attempts | See login attempt history |
| Unlock Account | Unlock a locked user account |

## Bundle Review

**/admin/bundles** — approve or reject tutor bundles. The queue shows discount
depth against the price floor and trailing 90-day sales per course, so you can
judge whether a bundle grows the basket or just discounts sales that were
already happening. Rejections carry a note back to the tutor.

## Program Revenue Share

**/admin/program-earnings** — assign a lead instructor to a cohort and release
their accrued earnings.

- Assigning an instructor **back-fills** accruals for installments already paid
- Release is only possible after the refund window and the cohort start; the
  screen says which is blocking
- You choose the recipient and the timing. **The amount is fixed at accrual and
  is not editable** — if an admin could type the amount, it would not be a
  revenue share
- Changing instructor mid-cohort does **not** move money already accrued. The
  original instructor keeps what they earned while teaching; the screen shows
  the held amount

## Reconciliation

The payment sweep reports drifting wallets on every run. That number should
always be zero. If it is not, a balance moved without a ledger entry — run
\`pnpm tsx scripts/reconcile-wallets.ts\` and investigate before it compounds.
`,
      },
    ],
  },

  // ─── ARCHITECTURE ──────────────────────────────────────
  {
    title: "Architecture",
    slug: "architecture",
    icon: "GitBranch",
    children: [
      {
        title: "Tech Stack",
        slug: "tech-stack",
        description: "Technologies and tools powering PalmTechnIQ.",
        audience: "developer",
        lastUpdated: "2026-04-17",
        content: `
# Tech Stack

## Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.5 | Full-stack React framework |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type safety |

## Database & ORM

| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary database |
| **Neon** | Serverless Postgres hosting |
| **Prisma** | ORM and migrations (v7.2) |

## Authentication

| Technology | Purpose |
|-----------|---------|
| **NextAuth** | Auth framework (v5.0 beta) |
| **bcryptjs** | Password hashing |
| **Google OAuth** | Social login via Google |
| **GitHub OAuth** | Social login via GitHub |
| **JWT** | Session management |

## Payments

| Technology | Purpose |
|-----------|---------|
| **Paystack** | Payment processing |
| **Webhooks** | Payment confirmation |

## Media & Communication

| Technology | Purpose |
|-----------|---------|
| **Zoom** | Virtual mentorship sessions (S2S OAuth) |
| **Resend** | Transactional emails |
| **UploadThing** | File uploads |
| **YouTube API** | Video content management |

## UI & Styling

| Technology | Purpose |
|-----------|---------|
| **Tailwind CSS** | Utility-first styling (v3.4) |
| **shadcn/ui** | Component library |
| **Radix UI** | Accessible primitives |
| **NextUI** | Additional UI components |
| **Lucide Icons** | Icon library |

## State & Data

| Technology | Purpose |
|-----------|---------|
| **Zustand** | Client state management (v5.0) |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Server Actions** | Server-side mutations |

## CMS & Content

| Technology | Purpose |
|-----------|---------|
| **Sanity** | Blog CMS |
| **next-sanity** | Sanity integration for Next.js |

## Analytics

| Technology | Purpose |
|-----------|---------|
| **Google Analytics** | Web analytics |
| **Mixpanel** | Product analytics |
| **Facebook Pixel** | Conversion tracking |

## DevOps

| Technology | Purpose |
|-----------|---------|
| **pnpm** | Package manager |
| **ESLint** | Code linting |
| **Prisma Migrate** | Database migrations |
`,
      },
      {
        title: "Database Schema",
        slug: "database-schema",
        description: "Complete database model overview and relationships.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# Database Schema

PalmTechnIQ uses PostgreSQL with Prisma ORM. The schema contains 37+ models organized into logical domains.

## Entity Relationship Overview

\`\`\`
User ──┬── Student (1:1)
       ├── Tutor (1:1)
       ├── Admin (1:1)
       ├── Enrollment ──── Course
       ├── Transaction
       ├── MentorshipSession
       ├── Certificate
       ├── CartItem
       └── Wishlist

Course ──┬── CourseModule
         │     ├── Lesson ── LessonProgress
         │     ├── Quiz ── Question
         │     └── Task ── TaskSubmission
         ├── Project ── Submission
         ├── Enrollment
         ├── Review
         ├── Discussion ── DiscussionReply
         └── GroupPurchase ── GroupTier, GroupMember
\`\`\`

## Recently Added

| Model | Purpose |
|---|---|
| \`WalletEntry\` | Append-only record of every \`walletBalance\` change. Invariant: \`walletBalance === sum(amount)\` |
| \`CourseBundle\` / \`CourseBundleItem\` | Tutor-priced multi-course packages with a review workflow |
| \`TutorEarning\` (extended) | Now covers COURSE, MENTORSHIP and PROGRAM sources. \`transactionId\`, \`transactionLineItemId\` and \`courseId\` are nullable so non-course earnings can share the table |
| \`ProgramCohort.leadInstructorId\` | Attribution for program revenue share |

> \`TutorEarning.installmentPaymentId\` and \`mentorshipSessionId\` are **unique**.
> That is load-bearing, not incidental: accrual can fire from more than one
> trigger, and the constraint is what makes the second one a no-op instead of a
> double credit.

## Core Models

### User & Profiles
- **User** — Central entity with auth, profile, banking, wallet data, and access control flags (\`mustChangePassword\`, \`invitedBy\`)
- **Student** — Education level, interests, goals, study tracking
- **Tutor** — Expertise, verifications, ratings, availability
- **Admin** — Privileges, department, and level

### UserRole Enum
\`\`\`prisma
enum UserRole {
  USER       // Default signup role
  STUDENT    // Enrolled in a course
  TUTOR      // Approved course creator
  ADMIN      // Platform administrator
  MENTOR     // Mentorship provider
  TESTER     // Invited documentation/testing access
  SUPERIOR   // Manages testers and testing operations
}
\`\`\`

### Course Content
- **Course** — Title, description, pricing, status, SEO fields
- **CourseModule** — Ordered sections within a course
- **Lesson** — Video content with duration and progress tracking
- **Quiz** — Assessment linked to lessons
- **Question** — Multiple-choice questions within quizzes

### Learning & Progress
- **Enrollment** — Student ↔ Course relationship with progress
- **LessonProgress** — Per-lesson completion tracking
- **QuizAttempt** — Quiz submission records with scores
- **TaskSubmission** — Student task submissions with grades
- **Submission** — Capstone project submissions

### Payments & Commerce
- **Transaction** — Payment records with Paystack references
- **TransactionLineItem** — Individual items in a transaction
- **PromoCode** — Discount codes (platform or instructor)
- **PromoRedemption** — Promo usage tracking
- **CartItem** — Shopping cart entries
- **Wishlist** — Saved courses

### Mentorship
- **MentorshipSession** — Session records with Zoom details
- **MentorshipPackage** — Pre-defined session packages
- **MentorshipPackageOrder** — Package purchase records

### Community
- **Review** — Course reviews and ratings
- **Discussion** — Course discussion threads
- **DiscussionReply** — Replies to discussions
- **Certificate** — Completion certificates
- **GroupPurchase** — Group buying campaigns
- **GroupTier** — Discount tiers for groups
- **GroupMember** — Group participant records

### Administration
- **WithdrawalRequest** — Tutor payout requests
- **Notification** — In-app notification records
- **Report** — Content/user reports
- **LoginAttempt** — Security audit trail
- **BlockedIP** — IP-based rate limit records

## Domain Map

97 models. Grouped by what they are for, so you know where to look.

| Domain | Models |
|---|---|
| **Identity** | \`User\`, \`Student\`, \`Tutor\`, \`Admin\`, \`Account\`, \`Session\`, \`VerificationToken\`, \`PasswordResetToken\` |
| **Security** | \`LoginAttempt\`, \`IPBlacklist\` |
| **Catalogue** | \`Course\`, \`CourseModule\`, \`Lesson\`, \`Category\`, \`CourseTag\`, \`Resource\` |
| **Learning** | \`Enrollment\`, \`LessonProgress\`, \`Quiz\`, \`Question\`, \`QuizAttempt\`, \`QuizAnswer\`, \`Project\`, \`Submission\`, \`Task\`, \`TaskSubmission\`, \`LearningPath\`, \`Skill\`, \`UserSkill\`, \`ProgressMilestone\` |
| **Commerce** | \`Transaction\`, \`TransactionLineItem\`, \`CartItem\`, \`Wishlist\`, \`PromoCode\`, \`PromoCodeUser\`, \`PromoRedemption\`, \`CoursePromotion\` |
| **Bundles** | \`CourseBundle\`, \`CourseBundleItem\` |
| **Group buying** | \`GroupTier\`, \`GroupPurchase\`, \`GroupMember\` |
| **Money out** | \`TutorEarning\`, \`WalletEntry\`, \`WithdrawalRequest\`, \`Payout\`, \`PaymentMethod\`, \`VatLedger\` |
| **Programs** | \`ProfessionalProgram\`, \`ProgramCohort\`, \`ProgramEnrollment\`, \`InstallmentPayment\`, \`ProgramRegistration\` |
| **Bootcamp** | \`Bootcamp\`, \`BootcampTrack\`, \`BootcampTier\`, \`BootcampEnrollment\`, \`BootcampTeam\` |
| **Mentorship** | \`MentorshipSession\`, \`MentorshipPackage\`, \`MentorshipPackageOrder\` |
| **Exam Center** | \`Exam\`, \`ExamSection\`, \`ExamQuestion\`, \`ExamCandidate\`, \`ExamAttempt\`, \`ExamResponse\`, \`ExamGrade\`, \`ExamGradeAudit\`, \`ExamEvent\`, \`QuestionBank\`, \`QuestionBankShare\`, \`BankQuestion\`, \`QuestionImportBatch\` |
| **AI** | \`AdvisorSession\`, \`AdvisorTurn\`, \`AdvisorRecommendation\`, \`AdvisorFollowUp\`, \`AIRecommendation\`, \`Chat\` |
| **Content** | \`BlogLike\`, \`BlogView\`, \`BlogBookmark\`, \`BlogComment\` (posts live in Sanity, not Postgres) |
| **Community** | \`Discussion\`, \`DiscussionReply\`, \`Review\`, \`ReviewReaction\`, \`Report\` |
| **Credentials** | \`Certificate\`, \`VolunteerCertificate\` |
| **Ops** | \`Notification\`, \`UserAnalytics\`, \`CourseAnalytics\`, \`PlatformSettings\`, \`Registration\` |

> \`PlatformEvent\` is referenced by \`lib/analytics/track.ts\` but **does not
> exist** in the schema. See **Analytics & Tracking**.

## Money Columns

Every currency column is \`Float\` (Postgres \`double precision\`) — 53 of them.
Arithmetic in \`lib/payments/revenue.ts\` is done in integer kobo to avoid
accumulating error, but storage has not been migrated.

**Do not add new \`Float\` money columns.** If you need one, that is the moment
to raise the migration rather than widen the problem.

## Key Relationships

- A **User** can be a Student, Tutor, and/or Admin simultaneously
- **Users** have access control fields: \`mustChangePassword\` (forces password change on login), \`invitedBy\` (tracks who invited a tester)
- **Courses** are owned by a User (tutor) and contain Modules → Lessons
- **Enrollments** connect Students to Courses with progress tracking
- **Transactions** link to Users and can contain multiple line items
- **MentorshipSessions** bridge Student and Tutor with Zoom integration
`,
      },
      {
        title: "Roles & Permissions",
        slug: "roles",
        description:
          "The seven roles, what each can reach, and how it is enforced.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# Roles & Permissions

## The roles

| Role | Purpose |
|---|---|
| \`USER\` | Signed up, has not bought anything yet |
| \`STUDENT\` | Has at least one enrolment. Promoted automatically on first purchase |
| \`TUTOR\` | Creates and sells courses, bundles and programs |
| \`MENTOR\` | Runs 1-on-1 sessions. Overlaps tutor routes |
| \`ADMIN\` | Full operational access |
| \`TESTER\` | Documentation and pre-release access only |
| \`SUPERIOR\` | Manages testers and testing operations |

\`USER\` → \`STUDENT\` promotion happens inside settlement, alongside creating
the \`Student\` profile row.

## Enforcement happens in two places

Both must agree, and forgetting one is the usual source of "it works locally
but not in production" routing bugs.

### 1. Middleware — \`proxy.ts\`
Route lists in \`routes.ts\` classify every path as public, auth, protected,
admin, tutor, mentor, student, payment, documentation or superior. The
middleware matches the request path and redirects when the role does not fit.

Patterns support segments: \`/courses/[slug]\` matches any single segment.

### 2. The action or page itself
Every server action re-checks. Middleware is routing, not authorisation — an
action reachable by any other path must defend itself:

\`\`\`ts
const session = await auth();
if (!session?.user?.id || session.user.role !== "ADMIN") {
  return { ok: false, error: "Forbidden" };
}
\`\`\`

## Post-login redirects

\`resolvePostLoginRedirect\` in \`actions/auth.ts\` validates \`?callbackUrl=\`
against a **per-role allowlist**, falling back to the role's default if the
path is not permitted.

> A public route with a return-to flow must be added to **both** the allowlist
> and \`publicRoutes\`. Miss the allowlist and the callbackUrl is silently
> discarded — the redirect looks wired up and quietly sends the user somewhere
> else. \`/bundles\` failed exactly this way.

OAuth sign-in reads the same \`?callbackUrl=\`; it previously hardcoded a
destination and dropped it.

## Adding a role-gated route

1. Add the path to the right list in \`routes.ts\`
2. Re-check the role inside the page or action
3. If it is public **and** returns users after login, add it to
   \`publicRoutes\` **and** the allowlist in \`resolvePostLoginRedirect\`
4. Add it to the relevant menu in \`lib/const.tsx\` — there are **two**
   structures, a sidebar nav and \`roleMenuItems\` for the profile dropdown.
   Editing one leaves the page unreachable from the other
`,
      },
      {
        title: "Integrations",
        slug: "integrations",
        description: "Third-party services, what each does, and how it fails.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# Integrations

| Service | Used for | Key env |
|---|---|---|
| **Paystack** | Payments, transfers, subaccounts | \`PAYSTACK_SECRET_KEY\`, \`PAYSTACK_PUBLIC_KEY\` |
| **Neon Postgres** | Database, via the Prisma Neon adapter | \`DATABASE_URL\` |
| **Resend** | Transactional email | \`RESEND_API_KEY\` |
| **Sanity** | Blog and CMS content | \`NEXT_PUBLIC_SANITY_PROJECT_ID\`, \`NEXT_PUBLIC_SANITY_DATASET\` |
| **DigitalOcean Spaces** | Uploads (S3-compatible) | \`DO_SPACES_*\` |
| **Zoom** | Mentorship meeting links | Zoom app credentials |
| **YouTube** | Lesson video hosting and chunked upload | OAuth credentials |
| **Upstash Redis** | Rate limiting | \`UPSTASH_REDIS_REST_*\` |
| **Meta** | Pixel and Conversions API | Pixel + access token |
| **Mixpanel / GA** | Product and web analytics | Project token / measurement id |
| **Socket.io** | Realtime notifications | — |

## Paystack

Payments initialise server-side and settle in
\`finalizePaystackByReference\`, which is **idempotent** — it returns early on
an already-completed transaction. The webhook at \`/api/webhook\` validates the
signature with HMAC SHA-512.

Amounts are sent in **kobo** (\`amount * 100\`); everything stored is naira.

## Storage — read this before debugging a broken image

Uploads go to **DigitalOcean Spaces**. Older records still point at an AWS S3
bucket (\`isce-image-uploader\`) that **no longer exists** and returns
\`NoSuchBucket\`.

Those rows hold a well-formed URL that 404s, so a fallback testing only for a
*missing* value never fires. Use \`CourseThumbnail\`, which falls back on the
load **error** as well as on absence.

## Zoom

Meeting links are created when a mentorship session starts. Failure is caught
and logged rather than blocking the session — the tutor is prompted to add a
link manually. Do not make it fatal; a payment has already succeeded by then.

## Rate limiting

Two mechanisms, deliberately different:
- **Upstash Redis** for anything that must hold across instances
- **In-memory buckets** in the advisor endpoints — per-instance, therefore a
  courtesy limit rather than a guarantee

## Failure posture

Integrations that are not on the critical path should degrade, not throw. CRM
events, analytics and Zoom creation all catch their own errors. A payment must
never fail because Meta Conversions was unreachable.
`,
      },
      {
        title: "Project Structure",
        slug: "project-structure",
        description: "File organization and directory conventions.",
        audience: "developer",
        lastUpdated: "2026-04-17",
        content: `
# Project Structure

## Directory Overview

\`\`\`
palmtechniq-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup, verify)
│   ├── (root)/            # Main application routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── courses/       # Course pages
│   │   ├── documentation/ # Protected docs (TESTER/SUPERIOR)
│   │   ├── change-password/ # Forced password change
│   │   ├── analytics/     # Platform analytics (redirects to admin)
│   │   ├── verify/        # Public student verification
│   │   ├── mentorship/    # Mentorship pages
│   │   ├── student/       # Student dashboard
│   │   ├── superior/      # Superior dashboard & tester mgmt
│   │   ├── tutor/         # Tutor dashboard
│   │   └── mentor/        # Mentor dashboard
│   ├── api/               # API routes (37+ endpoints)
│   └── studio/            # Sanity CMS Studio
├── actions/               # Server Actions (30+ files)
├── components/            # React Components
│   ├── ui/                # shadcn/ui primitives
│   ├── admin/             # Admin-specific components
│   ├── course/            # Course components
│   ├── docs/              # Documentation UI (sidebar, TOC, etc.)
│   ├── mentorship/        # Mentorship components
│   ├── auth/              # Auth forms
│   └── shared/            # Shared/common components
├── lib/                   # Utilities & Integrations
│   ├── docs/              # Documentation content & types
│   ├── payments/          # Paystack, pricing, promos
│   ├── notifications/     # Notification system
│   ├── email-templates/   # HTML email templates
│   ├── ai/                # AI integration
│   └── analytics/         # Analytics provider
├── prisma/                # Database
│   ├── schema.prisma      # Data model
│   └── migrations/        # Migration history
├── sanity/                # CMS Schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── docs/                  # Internal documentation
\`\`\`

## Conventions

### File Naming
- **Pages**: \`page.tsx\` (Next.js convention)
- **Layouts**: \`layout.tsx\`
- **Loading**: \`loading.tsx\`
- **Client Components**: \`*-client.tsx\` suffix
- **Server Actions**: Named by domain (e.g., \`course.ts\`, \`enrollment.ts\`)

### Code Organization
- **Server-first** — Components are Server Components by default
- **Client boundaries** — "use client" only when needed (interactivity, hooks)
- **Server Actions** — All data mutations go through \`actions/\` directory
- **API Routes** — Only for webhook handlers and external integrations
- **Colocation** — Page-specific components live near their routes

### Import Aliases
\`\`\`typescript
@/components  → components/
@/lib         → lib/
@/actions     → actions/
@/hooks       → hooks/
@/types       → types/
\`\`\`
`,
      },
    ],
  },

  // ─── API REFERENCE ──────────────────────────────────────
  {
    title: "API Reference",
    slug: "api-reference",
    icon: "Code",
    children: [
      {
        title: "Server Actions",
        slug: "server-actions",
        description: "Server-side data mutation functions.",
        audience: "developer",
        lastUpdated: "2026-04-17",
        content: `
# Server Actions

PalmTechnIQ uses Next.js Server Actions for all data mutations. These are organized by domain in the \`actions/\` directory.

## Action Files

| File | Purpose |
|------|---------|
| \`auth.ts\` | Registration, login, email verification, password reset |
| \`course.ts\` | Course CRUD, publishing, content management |
| \`enrollment.ts\` | Student enrollment and progress tracking |
| \`checkout.ts\` | Checkout flow and payment initiation |
| \`paystack.ts\` | Paystack payment processing |
| \`cart.ts\` | Shopping cart management |
| \`wishlist.ts\` | Wishlist add/remove operations |
| \`quiz.ts\` | Quiz creation and attempt management |
| \`assignment.ts\` | Task/assignment management |
| \`project.ts\` | Capstone project management |
| \`review.ts\` | Course review submission and management |
| \`student.ts\` | Student data and analytics |
| \`student-profile.ts\` | Student profile management |
| \`tutor-profile.ts\` | Tutor profile management |
| \`tutor-actions.ts\` | Tutor-specific operations (mentorship approval, etc.) |
| \`admin-dashboard.ts\` | Admin dashboard data |
| \`admin-applications.ts\` | Tutor application management |
| \`admin-enrollments.ts\` | Enrollment administration |
| \`security-admin.ts\` | Security management (IP blocks, account locks) |
| \`promotions.ts\` | Promo code management |
| \`group-purchase.ts\` | Group buying operations |
| \`withdrawal.ts\` | Tutor withdrawal requests |
| \`superior.ts\` | Tester management (add, remove, list, resend invite) |
| \`change-password.ts\` | Forced password change for invited users |
| \`analytics.ts\` | Platform analytics (overview, funnel, revenue, timeline, top courses) |
| \`navigation.ts\` | Dynamic navigation data |
| \`user-preferences.ts\` | User settings and preferences |
| \`user-stats.ts\` | User analytics and stats |
| \`mentorship-revenue.ts\` | Mentorship earnings tracking |

## Usage Pattern

\`\`\`typescript
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function createCourse(data: CourseInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const course = await db.course.create({
    data: {
      title: data.title,
      creatorId: session.user.id,
      // ...
    },
  });

  return course;
}
\`\`\`

## Error Handling

Server actions follow a consistent pattern:
1. Authenticate the user via \`auth()\`
2. Validate input data
3. Perform database operations
4. Return results or throw descriptive errors
`,
      },
      {
        title: "REST API Endpoints",
        slug: "rest-api",
        description: "HTTP API endpoints for external integrations.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# REST API Endpoints

While most operations use Server Actions, PalmTechnIQ exposes REST endpoints for webhooks, real-time features, and specific integrations.

## Authentication

### NextAuth
\`\`\`
GET/POST /api/auth/[...nextauth]
\`\`\`
Handles all authentication flows (login, logout, session, OAuth callbacks).

## Lessons

### Complete Lesson
\`\`\`
POST /api/lessons/[lessonId]/complete
\`\`\`
Marks a lesson as completed for the current user.

### AI Chat
\`\`\`
POST /api/lessons/[lessonId]/chat
\`\`\`
AI-powered lesson assistant for student questions.

### Video
\`\`\`
GET /api/lessons/[lessonId]/video
\`\`\`
Retrieves video content for a specific lesson.

## Quizzes

### Submit Quiz
\`\`\`
POST /api/quiz/[quizId]/submit
\`\`\`
Submits quiz answers for grading.

### Get Questions
\`\`\`
GET /api/quiz/[quizId]/questions
\`\`\`
Retrieves quiz questions (without answers).

### Get Attempts
\`\`\`
GET /api/quiz/[quizId]/attempts
\`\`\`
Retrieves the current user's quiz attempt history.

## Mentorship

### Offerings
\`\`\`
GET/POST /api/mentorship/offerings
\`\`\`
List or create mentorship offerings.

### Sessions
\`\`\`
POST /api/mentorship/session
\`\`\`
Create a new mentorship session.

### Payment
\`\`\`
POST /api/mentorship/proceed-payment
\`\`\`
Process mentorship payment after approval.

### Suggestions
\`\`\`
GET /api/mentorship/suggestions
\`\`\`
Get mentorship suggestions based on completed courses.

## Payments

### Finalize
\`\`\`
POST /api/paystack/finalize
\`\`\`
Finalize a Paystack transaction after successful payment.

### Promo Validation
\`\`\`
POST /api/promos/validate
\`\`\`
Validate a promo code and return discount details.

## Webhook

### Paystack Webhook
\`\`\`
POST /api/webhook
\`\`\`
Receives Paystack webhook events. Validates HMAC SHA-512 signature.

## Blog

### Track View
\`\`\`
POST /api/blog/view
\`\`\`
Track blog post views.

### Bookmark
\`\`\`
POST /api/blog/bookmark
\`\`\`
Bookmark/unbookmark a blog post.

### Like
\`\`\`
POST /api/blog/like
\`\`\`
Like/unlike a blog post.

## Other

### Search
\`\`\`
GET /api/search?q={query}
\`\`\`
Full-text search across courses and content.

### Notifications
\`\`\`
GET /api/notifications
\`\`\`
Get user notifications.

### Upload
\`\`\`
POST /api/upload
\`\`\`
File upload endpoint via UploadThing.

### Wallet
\`\`\`
GET /api/wallet/summary
POST /api/wallet/withdraw
\`\`\`
Wallet balance and withdrawal operations.

## Students

### Verify Student
\`\`\`
GET /api/students/verify?id={studentId}
\`\`\`
Publicly verify a student profile. Returns student name, avatar, rank, level, points, and enrollment data.

## Analytics

### Track Event
\`\`\`
POST /api/analytics/track
\`\`\`
Track a platform event (page view, course interaction, checkout, etc.). Used by the client-side analytics provider.

## Mailing Integration (External)

These endpoints are designed for consumption by the **isce-mail** bulk email system. They are not meant for browser clients or regular users.

### Sync Mailing Recipients
\`\`\`
GET /api/integrations/mailing/users
\`\`\`

Returns a paginated list of platform users and program registrations for use as mailing recipients.

**Authentication — Required**

All requests must include a valid integration key in one of the following headers (in order of precedence):

| Header | Format |
|--------|--------|
| \`x-integration-key\` | Raw key string |
| \`x-api-key\` | Raw key string |
| \`Authorization\` | \`Bearer <key>\` |

Keys are compared using **timing-safe equality** (constant-time) to prevent timing attacks.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| \`limit\` | number | Records per page. Default: \`250\`, max: \`1000\` |
| \`cursor\` | string | Cursor from a previous response for pagination |
| \`since\` | ISO 8601 date | Only return records updated after this timestamp (delta sync) |

**Example Request**
\`\`\`bash
curl https://palmtechniq.com/api/integrations/mailing/users?limit=500 \\
  -H "x-integration-key: <your-key>"
\`\`\`

**Response Shape**
\`\`\`json
{
  "data": [
    {
      "id": "cuid...",
      "email": "user@example.com",
      "name": "Jane Doe",
      "updatedAt": "2026-04-28T10:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "isActive": true,
      "source": "user"
    }
  ],
  "paging": {
    "hasMore": true,
    "nextCursor": "cuid...",
    "limit": 500
  },
  "sync": {
    "since": null,
    "latestSyncAt": "2026-04-28T10:00:00.000Z"
  }
}
\`\`\`

**Data Sources**

The endpoint merges two sources into one flat list:

| Source | Field | Notes |
|--------|-------|-------|
| \`User\` table | \`source: "user"\` | All registered platform accounts |
| \`ProgramRegistration\` table | \`source: "registration"\` | Waitlist / pre-enrollment signups |

When the same email appears in both tables, the \`User\` record wins (deduplication by email).
Only records with \`isActive: true\` are included in the final recipient list returned by isce-mail.

**Rate Limiting**

\`120 requests per 60 seconds\` per integration key (keyed by the first 12 characters).
Exceeding this limit returns \`HTTP 429\`.

**Error Responses**

| Status | Reason |
|--------|--------|
| \`401\` | Missing or invalid integration key |
| \`403\` | Caller IP not in \`MAILING_SYNC_ALLOWED_IPS\` allowlist |
| \`429\` | Rate limit exceeded |
| \`500\` | Integration key not configured, or database error |

**Key Rotation**

Two keys are supported simultaneously to allow zero-downtime rotation:

- \`MAILING_SYNC_API_KEY\` — the active primary key
- \`MAILING_SYNC_API_KEY_PREVIOUS\` — the previous key (still accepted during rotation)

Generate new keys with:
\`\`\`bash
node scripts/generate-integration-keys.js
\`\`\`

## Full Endpoint Index

Every route under \`app/api\`, grouped. Auth column: **session** = signed-in
user, **secret** = bearer token, **public** = no auth.

### Payments
| Endpoint | Auth | Purpose |
|---|---|---|
| \`POST /api/paystack/finalize\` | session | Settle a transaction by reference |
| \`POST /api/webhook\` | signature | Paystack webhook, HMAC SHA-512 verified |
| \`GET /api/promos/validate\` | session | Validate a promo code |
| \`GET /api/wallet/summary\` | session | Balance, earnings, accrued, pending |
| \`POST /api/wallet/withdraw\` | session | Request a withdrawal |
| \`POST /api/admin/withdrawals/approve\` | admin | Approve and transfer |
| \`POST /api/admin/withdrawals/reject\` | admin | Reject and return funds |
| \`POST /api/group-purchase/join\` | session | Join a group by invite code |

### Learning
| Endpoint | Auth | Purpose |
|---|---|---|
| \`POST /api/lessons/[lessonId]/complete\` | session | Mark a lesson complete |
| \`GET /api/lessons/[lessonId]/video\` | session | Signed video access |
| \`POST /api/lessons/[lessonId]/chat\` | session | Lesson AI assistant |
| \`GET /api/quiz/[quizId]/questions\` | session | Quiz questions |
| \`POST /api/quiz/[quizId]/submit\` | session | Submit — **scored server-side** |
| \`GET /api/quiz/[quizId]/attempts\` | session | Attempt history |

### Mentorship
| Endpoint | Auth | Purpose |
|---|---|---|
| \`GET /api/mentorship/offerings\` | public | Browse offerings |
| \`GET/DELETE /api/mentorship/offerings/[offeringId]\` | session | Manage one |
| \`POST /api/mentorship/proceed-payment\` | session | Pay an approved request |
| \`GET /api/mentorship/session/[sessionId]\` | session | Session detail |
| \`GET /api/mentorship/suggestions\` | session | Suggested mentors |

### AI
| Endpoint | Auth | Purpose |
|---|---|---|
| \`POST /api/advisor/chat\` | public | Course advisor, rate limited |
| \`POST /api/advisor/lead\` | public | Capture a lead |

### Content & discovery
| Endpoint | Auth | Purpose |
|---|---|---|
| \`GET /api/search\` | public | Global search |
| \`GET /api/resources\` | session | Course resources |
| \`POST /api/blog/view\` · \`like\` · \`bookmark\` · \`comments\` | mixed | Blog engagement |
| \`GET /api/wishlist/check\` | session | Wishlist state |

### Identity & credentials
| Endpoint | Auth | Purpose |
|---|---|---|
| \`GET/POST /api/auth/[...nextauth]\` | public | NextAuth |
| \`GET /api/certificates/verify\` | public | Verify a certificate |
| \`POST /api/students/verify\` | session | Student verification |
| \`POST /api/applications\` | public | Tutor/mentor application |
| \`GET /api/referral/track\` | public | Set the 30-day referral cookie |
| \`GET /api/notifications\` | session | Poll notifications |

### Media
| Endpoint | Auth | Purpose |
|---|---|---|
| \`POST /api/upload\` | session | Upload to DigitalOcean Spaces |
| \`POST /api/youtube/upload\` · \`/chunk\` | session | Chunked video upload |
| \`GET /api/youtube/channel\` | session | Channel info |

### Scheduled & integration
| Endpoint | Auth | Purpose |
|---|---|---|
| \`POST /api/cron/exam-sweep\` | secret | Close expired attempts |
| \`POST /api/cron/payment-sweep\` | secret | Settle stranded charges |
| \`GET /api/integrations/mailing/users\` | api key | Mailing list sync |
| \`POST /api/analytics/track\` | session | Event tracking (see Analytics) |
| \`POST /api/admin/fix-students\` | admin | Backfill missing student profiles |

## Conventions

- Cron endpoints **fail closed**: an unset \`CRON_SECRET\` returns 503, never
  an unauthenticated run
- Secrets are compared in constant time
- Public endpoints that write are rate limited
- Anything touching money re-checks authorisation inside the handler; the
  middleware is routing, not authorisation
`,
      },
    ],
  },

  // ─── DEVELOPMENT ──────────────────────────────────────
  {
    title: "Development",
    slug: "development",
    icon: "Wrench",
    children: [
      {
        title: "Analytics & Tracking",
        slug: "analytics",
        description:
          "Product events, web analytics, and a tracking table that does not exist.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# Analytics & Tracking

## Known defect — read first

\`trackEvent\` writes to \`db.platformEvent\`, but **there is no
\`PlatformEvent\` model in the schema**. Every call fails:

\`\`\`
[Analytics] Failed to track event: checkout_started
TypeError: Cannot read properties of undefined (reading 'create')
\`\`\`

The failure is caught and logged, so nothing breaks — which is precisely why it
went unnoticed. **No product event has ever been recorded.** Any funnel
analysis based on \`PlatformEvent\` is analysing an empty table.

Fixing it means adding the model and pushing the schema. Until then, treat
in-app event data as absent rather than sparse.

## What does work

| Layer | Mechanism |
|---|---|
| Web analytics | Google Analytics via \`lib/gtag.ts\` |
| Product analytics | Mixpanel |
| Ad attribution | Meta Pixel (\`lib/fbpixel.ts\`) and the Conversions API server-side |
| Course/user rollups | \`CourseAnalytics\`, \`UserAnalytics\` |
| Tutor dashboards | Derived from \`TutorEarning\` and enrolments directly |

Meta receives both a browser Pixel event and a server-side Conversions event
for purchases, which is deliberate — the server event survives ad blockers.

## Tutor earnings figures

Anything labelled *earnings* reads from \`TutorEarning\`, filtered to
\`AVAILABLE\` and \`PAID\`. It must not be computed from \`Transaction.amount\`:
that is the gross the student paid, including VAT owed to FIRS and the
platform's share. Reporting it as tutor earnings overstates by roughly 4x.

## Adding an event

\`\`\`ts
import { trackEvent, PLATFORM_EVENTS } from "@/lib/analytics/track";

trackEvent(PLATFORM_EVENTS.CHECKOUT_COMPLETED, {
  userId, entityType: "transaction", entityId: tx.id, value: tx.amount,
});
\`\`\`

Never \`await\` it in a payment path, and never let it throw — a failed
analytics write must not fail a purchase.
`,
      },
      {
        title: "Background Jobs",
        slug: "background-jobs",
        description:
          "Scheduled sweeps that recover stranded payments and close expired exams.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# Background Jobs

Two scheduled sweeps, both driven by **GitHub Actions** rather than a hosted
cron. Actions is free for this workload and each run is a single \`curl\`.

| Job | Schedule | Endpoint |
|---|---|---|
| Exam sweep | every 5 min | \`/api/cron/exam-sweep\` |
| Payment sweep | every 15 min | \`/api/cron/payment-sweep\` |

## Authorisation

Both are authorised by a shared secret, not a session — there is no user behind
them.

\`\`\`
Authorization: Bearer $CRON_SECRET
\`\`\`

Compared in constant time, and **failing closed**: if \`CRON_SECRET\` is unset
the endpoint returns 503 rather than running unauthenticated.

### Required configuration
| Where | Keys |
|---|---|
| GitHub → Settings → Secrets → Actions | \`APP_URL\`, \`CRON_SECRET\` |
| Hosting environment | \`CRON_SECRET\` |

Generate the secret yourself — it is not issued by anyone:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

> **Scheduled workflows only run from the default branch.** A \`schedule:\`
> trigger on a feature branch never fires. If a sweep appears never to have
> run, check that its workflow is on \`main\` before debugging anything else.

## Payment sweep

Settlement normally happens on the Paystack callback and webhook. This catches
what they miss — browser closed mid-redirect, webhook lost, or settlement
itself throwing — where money is collected and nothing is delivered.

- **15 minute grace period** so a student still on the Paystack page is never
  touched
- **90 day recovery horizon.** Deliberately generous: a charge that succeeded
  weeks ago and never settled is the *worst* case, not the least important
- Bounded batch per run; an abandoned checkout is marked \`FAILED\` on its first
  pass and leaves the pending set, so nothing is retried forever
- Also reports **wallet drift**, which should always be zero

Every pass is idempotent because \`finalizePaystackByReference\` re-verifies
with Paystack and returns early on an already-completed transaction.

## Exam sweep

Auto-submits expired attempts, closes finished exams, marks no-shows. A
backstop — the candidate's own browser submits when the clock runs out.

## Testing by hand

\`\`\`bash
curl -i -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/payment-sweep"
\`\`\`

401 means the secret does not match; 503 means it is not configured. Both
workflows also support **Run workflow** from the Actions tab for an immediate
run.
`,
      },
      {
        title: "Security",
        slug: "security",
        description: "Security measures, IP protection, and best practices.",
        audience: "developer",
        lastUpdated: "2026-04-28",
        content: `
# Security

PalmTechnIQ implements multiple layers of security to protect user data and prevent abuse.

## IP-Based Brute Force Protection

### Rate Limiting
- **10 failed login attempts** per IP → 1-hour automatic block
- **5 failed attempts** per email → 15-minute account lock
- All attempts are logged with timestamps and IP addresses
- Automatic cleanup of old records

### Database Schema

\`\`\`prisma
model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  ipAddress String
  success   Boolean
  userAgent String?
  createdAt DateTime @default(now())
}

model BlockedIP {
  id        String   @id @default(cuid())
  ipAddress String   @unique
  reason    String?
  blockedAt DateTime @default(now())
  expiresAt DateTime?
}
\`\`\`

### Admin Functions
- \`getSecurityDashboard()\` — Overview of security status
- \`blockIP(ip)\` — Manually block an IP
- \`unblockIP(ip)\` — Remove IP from block list
- \`getLoginAttempts(filters)\` — Query login attempt logs
- \`unlockAccount(email)\` — Unlock a locked user account

## Content Security Policy

The \`next.config.mjs\` sets security headers:
- \`Content-Security-Policy\` — Restricts resource loading
- \`X-Frame-Options: DENY\` — Prevents clickjacking
- \`X-Content-Type-Options: nosniff\` — Prevents MIME sniffing
- \`Referrer-Policy: strict-origin-when-cross-origin\`

## Authentication Security

- **Password hashing** — bcrypt with appropriate salt rounds
- **JWT tokens** — Signed with AUTH_SECRET
- **Session expiry** — Configurable token lifetime
- **OAuth** — Server-side token exchange (no client secrets exposed)
- **CSRF protection** — Built into NextAuth
- **Forced password change** — Users with \`mustChangePassword: true\` must change their password before accessing any route

## Role-Based Access Control (RBAC)

The middleware (\`proxy.ts\`) enforces role-based access at the route level:

| Route Category | Allowed Roles | Redirect on Deny |
|---------------|--------------|-------------------|
| \`/admin/*\` | ADMIN | \`/courses\` |
| \`/tutor/*\` | TUTOR | \`/courses\` |
| \`/superior/*\` | SUPERIOR | \`/courses\` |
| \`/documentation/*\` | TESTER, SUPERIOR | \`/courses\` |
| \`/change-password\` | Any authenticated | — |

### Documentation Access Control
- Documentation pages at \`/documentation\` are **not publicly accessible**
- Only users with \`TESTER\` or \`SUPERIOR\` roles can view documentation
- Server-side auth check in the documentation layout provides a second layer of protection
- Pages are rendered dynamically (\`force-dynamic\`) to prevent static generation from bypassing auth

### Forced Password Change Flow
1. Middleware checks \`session.mustChangePassword\` on every request
2. If true, redirects to \`/change-password\` regardless of the target route
3. The \`/change-password\` page itself is excluded from this redirect
4. After password change, \`mustChangePassword\` is set to \`false\` in the database

## Payment Security

- **Webhook signature verification** — HMAC SHA-512 validation
- **Server-side payment processing** — No sensitive data on client
- **Amount verification** — Server validates expected amounts
- **Idempotent processing** — Duplicate webhook handling

## Integration Key Authentication

External systems (e.g. **isce-mail**) authenticate to protected API routes via a pre-shared integration key.

### How It Works
- The caller sends the key in the \`x-integration-key\`, \`x-api-key\`, or \`Authorization: Bearer\` header
- \`lib/integration-auth.ts\` validates the key using **timing-safe comparison** (\`crypto.timingSafeEqual\`) to prevent timing-based key enumeration
- Two keys are valid simultaneously: \`MAILING_SYNC_API_KEY\` (primary) and \`MAILING_SYNC_API_KEY_PREVIOUS\` (rotation key)
- An optional IP allowlist (\`MAILING_SYNC_ALLOWED_IPS\`) can restrict callers to specific IP addresses

### Generating Keys
Keys are 256-bit cryptographically random hex strings generated with:
\`\`\`bash
node scripts/generate-integration-keys.js
\`\`\`
Add the output values to your \`.env\` file. During a key rotation:
1. Move the current primary key to \`MAILING_SYNC_API_KEY_PREVIOUS\`
2. Set the new key as \`MAILING_SYNC_API_KEY\`
3. Update isce-mail's \`PALMTECHNIQ_SYNC_API_KEY\` env var to the new key
4. Once confirmed working, clear \`MAILING_SYNC_API_KEY_PREVIOUS\`


- \`proxy.ts\` — Middleware with RBAC enforcement
- \`routes.ts\` — Route classification and role-based redirects
- \`lib/ip-rate-limit.ts\` — IP-based rate limiting logic
- \`lib/rate-limit.ts\` — General rate limiting
- \`lib/integration-auth.ts\` — Integration key validation (timing-safe compare, IP allowlist)
- \`actions/security-admin.ts\` — Admin security functions
- \`actions/superior.ts\` — Tester invite and management
- \`actions/change-password.ts\` — Forced password change
- \`next.config.mjs\` — Security headers
- \`auth.config.ts\` — Auth security configuration
- \`scripts/generate-integration-keys.js\` — Generate secure 256-bit integration keys
`,
      },
      {
        title: "SEO Implementation",
        slug: "seo",
        description: "Search engine optimization strategy and implementation.",
        audience: "developer",
        lastUpdated: "2026-08-14",
        content: `
# SEO Implementation

PalmTechnIQ follows a comprehensive SEO strategy to maximize search visibility.

## Open Graph & Social

### Dynamic OG Images
- **Site-wide** — \`app/opengraph-image.tsx\` generates branded OG images
- **Per-course** — \`app/(root)/courses/[courseId]/opengraph-image.tsx\` generates course-specific images
- **Twitter cards** — \`app/twitter-image.tsx\` for Twitter previews

### Social Profiles
Linked via JSON-LD Organization schema:
- Facebook, Instagram, LinkedIn, YouTube, X (Twitter)

## Metadata

### Per-Page Metadata
Each route exports its own metadata configuration:
- Title (using template: \`%s | PalmTechnIQ\`)
- Description
- Canonical URL
- Open Graph data
- Twitter card data

### Dynamic Metadata
Course pages generate metadata from database:
\`\`\`typescript
export async function generateMetadata({ params }) {
  const course = await getCourse(params.courseId);
  return {
    title: course.title,
    description: course.description,
    // ...
  };
}
\`\`\`

## Structured Data (JSON-LD)

| Schema Type | Location | Purpose |
|------------|----------|---------|
| Organization | Root layout | Company info and social links |
| WebSite | Root layout | Site-wide search action |
| Course | Course detail pages | Rich course snippets |
| BreadcrumbList | Course pages | Navigation breadcrumbs |
| FAQPage | Help page | FAQ rich results |

## Crawling

### robots.ts
\`\`\`typescript
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://palmtechniq.com/sitemap.xml',
  };
}
\`\`\`

### Dynamic Sitemap
\`app/sitemap.ts\` generates a comprehensive sitemap including:
- Static pages (about, contact, courses, etc.)
- Dynamic course pages from database
- Blog posts from Sanity CMS

## PWA

- \`app/manifest.ts\` generates a Web App Manifest
- Standalone display mode
- Theme color: \`#10b981\`
- Apple mobile web app support

## Custom 404
- Branded 404 page at \`app/not-found.tsx\`
- Helpful navigation links
- Search functionality

## Current Coverage — audited 2026-08-14

Measured against the codebase, not aspiration.

| Surface | State |
|---|---|
| \`sitemap.ts\` | Static pages, courses, categories, blog posts |
| \`robots.ts\` | Present |
| \`rss.xml\`, \`news-sitemap.xml\` | Present |
| \`manifest.ts\` | PWA manifest present |
| Dynamic OG images | \`opengraph-image.tsx\`, \`twitter-image.tsx\` |
| JSON-LD | Home, blog index, blog post, course detail, help, root layout |
| \`generateMetadata\` | **5 files** |

## Gaps To Close

These are the concrete items for an SEO push, in rough order of value.

### 1. Missing from the sitemap
Three revenue surfaces are not submitted at all:

- **Bundles** — \`/bundles/[slug]\`, already a public route
- **Programs** — \`/enroll\` exists, but individual programs have no indexable page
- **Bootcamp** — its own route group, entirely absent

Anything that can be linked and bought should be in the sitemap.

### 2. Metadata coverage is thin
Only five files export \`generateMetadata\`. Every public, indexable route
wants a title and description written for search, not inherited from the
layout. Highest value first: course detail, bundle landing, blog post, program
and bootcamp pages.

### 3. Structured data
JSON-LD is on six pages. Missing where it would matter most:

| Page | Schema |
|---|---|
| Course detail | \`Course\` with \`provider\`, \`offers\`, \`aggregateRating\` |
| Bundle landing | \`Product\` / \`ItemList\` with \`offers\` |
| Program | \`Course\` with \`hasCourseInstance\` for cohort dates |
| Tutor profile | \`Person\` |
| Certificate verification | \`EducationalOccupationalCredential\` |

Course and Product markup drive rich results — the difference between a blue
link and a listing with price and rating.

### 4. Canonicals and duplicates
\`/courses/[courseId]\` accepts both a slug and a cuid. Two URLs serving one
course splits ranking signals. Set a canonical to the slug form, and make sure
category filter URLs (\`/courses?category=\`) either canonicalise to
\`/courses\` or are genuinely distinct pages.

### 5. Images
Course thumbnails point at a deleted bucket and fall back to generated
placeholders. Placeholder images cannot rank, cannot be shared meaningfully,
and weaken OG cards. Restoring real thumbnails is an SEO task as much as a
cosmetic one.

### 6. Content depth
The blog is the main organic surface and is already wired for it — Sanity CMS,
RSS, a news sitemap, JSON-LD, and engagement models (\`BlogView\`,
\`BlogLike\`, \`BlogComment\`, \`BlogBookmark\`). It is the cheapest place to
add indexable depth.

## Before Changing Anything

- Confirm \`NEXT_PUBLIC_URL\` is the canonical production origin. Sitemap and
  OG URLs are built from it, and a wrong value poisons every absolute URL
- \`/documentation\` and \`/studio\` should not be competing for search traffic
  with the marketing surfaces; decide deliberately whether they are indexable
- Do not index anything behind auth. Student, tutor and admin routes are
  redirected by the middleware, but a sitemap entry still invites a crawl
`,
      },
      {
        title: "Deployment",
        slug: "deployment",
        description: "Build, deploy, and maintain the platform.",
        audience: "developer",
        lastUpdated: "2026-04-17",
        content: `
# Deployment

## Build Process

\`\`\`bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Build the application
pnpm build
\`\`\`

## Environment Setup

Ensure all environment variables are set in your deployment environment:
- Database connection string (DATABASE_URL)
- Auth secrets (AUTH_SECRET, OAuth credentials)
- Payment keys (PAYSTACK_SECRET_KEY)
- Zoom credentials (ZOOM_ACCOUNT_ID, etc.)
- Email provider (RESEND_API_KEY)
- Analytics IDs (GA, Pixel, Mixpanel)
- Sanity credentials

## Database Migrations

\`\`\`bash
# Run pending migrations in production
npx prisma migrate deploy

# (NEVER run 'prisma migrate dev' in production)
\`\`\`

## Health Checks

Verify deployment:
1. **Homepage loads** — Check \`/\`
2. **Auth works** — Try login/signup
3. **Database connected** — Check \`/api/health\` or load courses
4. **Payments ready** — Verify Paystack webhook URL is configured
5. **Email sending** — Test email verification flow
6. **Zoom integration** — Verify S2S OAuth credentials

## Monitoring

- **Google Analytics** — User behavior and traffic
- **Mixpanel** — Product analytics and funnels
- **Error tracking** — Check application logs
- **Database monitoring** — Neon dashboard for query performance

## Production Migration (Legacy)

For migrating from a legacy database, refer to \`docs/prod-migration-runbook.md\` which covers:
- Data mapping between old and new schemas
- FDW (Foreign Data Wrapper) setup for cross-database migration
- Cutover steps with scheduled downtime
- Validation queries
- Rollback procedures
`,
      },
    ],
  },
];

// Helper to flatten all pages for search
export function getAllDocPages(): Array<{
  section: string;
  sectionSlug: string;
  page: DocPage;
}> {
  const pages: Array<{
    section: string;
    sectionSlug: string;
    page: DocPage;
  }> = [];

  for (const section of docSections) {
    if (section.children) {
      for (const page of section.children) {
        pages.push({
          section: section.title,
          sectionSlug: section.slug,
          page,
        });
      }
    }
  }

  return pages;
}

// Helper to find a specific doc page
export function findDocPage(
  sectionSlug: string,
  pageSlug: string,
): {
  section: DocSection;
  page: NonNullable<DocSection["children"]>[0];
} | null {
  const section = docSections.find((s) => s.slug === sectionSlug);
  if (!section?.children) return null;

  const page = section.children.find((p) => p.slug === pageSlug);
  if (!page) return null;

  return { section, page };
}

// Helper to get next/prev pages for navigation
export function getAdjacentPages(sectionSlug: string, pageSlug: string) {
  const allPages = getAllDocPages();
  const currentIndex = allPages.findIndex(
    (p) => p.sectionSlug === sectionSlug && p.page.slug === pageSlug,
  );

  return {
    prev: currentIndex > 0 ? allPages[currentIndex - 1] : null,
    next:
      currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null,
  };
}
