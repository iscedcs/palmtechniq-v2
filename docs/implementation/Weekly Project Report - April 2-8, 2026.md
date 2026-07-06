# Weekly Project Report

**Reporting Period:** March 30, 2026 – April 8, 2026
**Prepared by:** Ignatius Emeka J.
**Date:** April 9, 2026

## Overview

This report provides an update on the progress of the PalmTechnIQ v2 project, focusing on the features delivered, bug fixes, and improvements made during the reporting period. A total of **9 commits** were pushed across **67 files changed**, with **5,095 lines added** and **567 lines removed**. Work spanned three major feature areas: the course promotion/advertising system, a complete SEO implementation, and the tutor referral & course program type system.

---

## Project: PalmTechnIQ v2

1.  **Project Name:** PalmTechnIQ v2 — EdTech Learning Management Platform
2.  **Objective / Scope:** A comprehensive Next.js-based EdTech platform for teaching courses, mentorship sessions, and professional program enrollment, targeting the Nigerian market with Paystack payment integration, AI-powered recommendations, and multi-role support (Student, Tutor, Admin, Mentor).
3.  **Current Phase:** Development
4.  **Project Features (Features worked on this week):**

    ### Feature 1: Course Promotion & Advertising System _(March 30)_

    Built a full-stack course promotion system enabling tutors to advertise their courses on the platform via paid promotional slots.

    **What was implemented:**
    - **Promotion Server Actions** (`actions/promotions.ts` — 482 lines): Platform-level promotion settings (enable/disable promotions globally, tutor promotion fee of ₦5,000, max 5 active promotions, default 7-day duration), automated scheduling logic with 1-hour gaps between promotions, and admin/tutor create/approve/delete/update actions.
    - **Admin Promotions Dashboard** (`app/(root)/admin/promotions/`): Full admin interface for managing all promotions with search and status filtering (ACTIVE, PENDING, REJECTED, EXPIRED), promotion creation with headline/description/CTA/pricing fields, approve/reject workflow for tutor requests, impression/click analytics, and priority configuration.
    - **Tutor Promotions Dashboard** (`app/(root)/tutor/promotions/`): Tutor-facing interface to request promotions for their courses, pay the promotion fee via Paystack with payment verification, track promotion status and performance metrics (impressions/clicks), and view scheduling/availability.
    - **Promotional Popup Component** (`components/promotions/course-promotion-popup.tsx`): Client-side modal displaying promoted course offers with rich course data (title, tutor, level, enrollments, reviews), promo vs. original pricing in Naira, custom CTA with enrollment links, and dismissal persistence via localStorage.
    - **Database Schema Updates** (`prisma/schema.prisma`): Added 55 lines of new schema including promotion models, status enums, and relations.
    - **Supporting Changes**: Updated route protection rules in `routes.ts`, fixed enrollment wizard bugs, updated cart store, corrected public navigation client, and fixed enrollment confirmation email template.

    ***

    ### Feature 2: Complete SEO Implementation _(April 1)_

    Delivered a comprehensive SEO overhaul across the entire public-facing platform.

    **What was implemented:**
    - **Dynamic Sitemap** (`app/sitemap.ts`): Auto-generated `sitemap.xml` with 14 static public pages, all published courses from the database with slug-based URLs, all active categories as filtered listing URLs, and priority/change-frequency metadata (1.0 for homepage down to 0.4 for press).
    - **Robots.txt** (`app/robots.ts`): Crawler directives allowing all public pages while disallowing `/api/`, `/admin/`, `/student/`, `/tutor/`, `/mentor/`, and all auth routes (login, signup, password reset, verification). Includes sitemap reference to `https://palmtechniq.com/sitemap.xml`.
    - **PWA Manifest** (`app/manifest.ts`): Progressive Web App manifest with standalone display mode, PalmTechnIQ branding (dark theme `#0f172a`, emerald accent `#10b981`), 192×192 and 512×512 icons with maskable support, and education/productivity categories.
    - **Open Graph & Twitter Images**: Dynamic per-course OG images via `next/og` (`app/(root)/courses/[courseId]/opengraph-image.tsx` — 169 lines), site-wide OG image (`app/opengraph-image.tsx` — 122 lines), and Twitter card image (`app/twitter-image.tsx` — 116 lines).
    - **Per-Page Metadata Layouts**: Added SEO metadata layouts for 13 public routes — About, Become a Tutor, Blog, Careers, Contact, Features/AI Interview, Features/Mentorship, Help, Mentorship, Partners, Press, Search, and legal pages (Privacy, Terms).
    - **JSON-LD Structured Data**: Rich schema markup on course detail pages including Organization, WebSite (with search action), and Course schemas for search engine rich results.
    - **Course Detail Page Enhancement** (`app/(root)/courses/[courseId]/page.tsx`): Added 122+ lines of structured data, enhanced meta tags, and canonical URLs.
    - **Custom 404 Page** (`app/not-found.tsx`): Branded not-found page for improved UX.
    - **SEO Documentation** (`docs/SEO-IMPLEMENTATION.md` — 251 lines): Comprehensive documentation covering the entire SEO strategy.

    **Follow-up fixes on the same day (April 1):**
    - Fixed JSON-LD serialization to use script children instead of `dangerouslySetInnerHTML` for security best practices.
    - Added Semgrep suppression annotations for safe JSON-LD script tags.
    - Removed Edge runtime from course OG image generation to avoid the 2MB size limit.

    ***

    ### Feature 3: Tutor Referral System & Course Program Type _(April 8)_

    Implemented a tutor referral/affiliate system and enhanced course creation with program type support.

    **What was implemented:**
    - **Referral System Core** (`lib/referral.ts`): Unique 8-character hex referral code generation for tutors, code-to-tutor resolution for attribution, and 30-day secure/httpOnly tracking cookie (`tutor_ref`).
    - **Referral Tracking API** (`app/api/referral/track/route.ts`): `GET /api/referral/track?ref=CODE` endpoint that validates referral codes, sets tracking cookies, and returns the tutor's user ID for client-side attribution.
    - **Referral Tracker Component** (`components/shared/referral-tracker.tsx`): Invisible component that auto-triggers the referral tracking API on mount for background attribution.
    - **Tutor Earnings Enhancement**: Updated the referral model so tutors receive 50% of referred earnings. Updates to `actions/checkout.ts`, `actions/withdrawal.ts`, `lib/payments/pricing.ts`, and `lib/payments/finalizePaystack.ts` to calculate and attribute referral commissions.
    - **Course Type Selector** (`components/pages/tutor/courses/course-type-selector.tsx` — 225 lines): New interactive form component allowing tutors to toggle between REGULAR courses and structured PROGRAM courses, select from predefined programs with duration picker, and auto-populate course titles based on program selection.
    - **Curriculum Builder Overhaul**: Major refactor of `course-curriculum-form.tsx` (577 lines changed) and `course-curriculum-builder.tsx` (300 lines changed) to support the new program-type course structure.
    - **Course Creation Updates**: Updated `actions/tutor-actions.ts` (+66 lines) and `actions/course.ts` (+30 lines) to handle program type during creation and editing. Updated course card display, checkout page, and course detail page.
    - **Admin Dashboard Enhancement**: Added referral tracking metrics to `actions/admin-dashboard.ts` (+36 lines).
    - **Database Schema**: Added 13 lines of new schema for referral-related models.
    - **Programs Data**: New `data/programs.ts` (+47 lines) with predefined program definitions and durations.

    ***

    ### Feature 4: Bug Fixes & Security Patches _(April 8)_
    - **Navigation Runner Issue**: Fixed a rendering issue in the main navigation component and tutor course card component.
    - **Dependency Vulnerabilities**: Updated 4+ packages in `package.json` to patch known security vulnerabilities (71 lines changed in `pnpm-lock.yaml`).

5.  **What Has Been Completed So Far:**
    - Core platform: Authentication (multi-provider), course CRUD, enrollment system, Paystack payments, shopping cart, group buying, mentorship system, professional programs with installments, AI features (course advisor, lesson assistant), student/tutor/admin dashboards, notifications, reviews/discussions, quiz/project/assignment system, wallet & withdrawals, analytics tracking.
    - **This week**: Full promotion/advertising system, complete SEO implementation (sitemap, robots, OG images, JSON-LD, PWA manifest, per-page metadata), tutor referral affiliate system, course program type support, curriculum builder improvements, and security patches.

6.  **What Is Currently in Progress:**
    - Refinement of the referral commission tracking and payout flow
    - Tutor wallet integration with referral earnings display
    - Promotion analytics dashboard improvements

7.  **What Is Left to Be Done:**
    - End-to-end testing of the promotion lifecycle (payment → approval → display → expiry)
    - Referral link sharing UI for tutors (copy link, share on social media)
    - Referral earnings reporting in admin finance dashboard
    - SEO monitoring and performance validation (Core Web Vitals, search console integration)
    - Production deployment and verification of SEO artifacts (sitemap accessibility, OG image rendering)
    - Comprehensive QA pass across all new features

8.  **Any Blockers or Dependencies:**
    - None identified at this time. All features were delivered without external blockers.

9.  **Expected Timeline to Next Milestone:** End of next reporting week (April 15, 2026) — completion of referral UI polish, promotion system QA, and production SEO verification.

**Relevant Links:**

- Live URL: https://palmtechniq.com
- Repository: _(internal)_

---

## General Blockers / Cross-Project Dependencies

- No cross-project blockers identified this week.

## Next Steps / Overall Priorities

1.  Complete QA and testing for the promotion system end-to-end flow
2.  Build tutor-facing referral link sharing UI and referral earnings dashboard
3.  Validate SEO implementation in production (Google Search Console, OG debugger, sitemap indexing)
4.  Address any post-deployment issues from the 3 major features shipped this week
5.  Continue security auditing and dependency updates
