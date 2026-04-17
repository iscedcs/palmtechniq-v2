import type { DocPage, DocSection } from "./types";

export const DOC_VERSION = "v2.0.0";

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
          "Welcome to PalmTechnIQ — an overview of the platform and what it offers.",
        audience: "all",
        lastUpdated: "2026-04-16",
        content: `
# Welcome to PalmTechnIQ

<version>${DOC_VERSION}</version>

PalmTechnIQ is a full-featured e-learning platform designed for AI, web development, data science, and career-focused technical skills. It offers a complete learning experience with courses, mentorship, projects, quizzes, and certificates.

## Who Is This For?

PalmTechnIQ serves multiple audiences:

| Audience | What You Get |
|----------|-------------|
| **Students** | Access courses, get mentorship, complete projects, earn certificates |
| **Tutors** | Create and sell courses, offer mentorship sessions, track earnings |
| **Mentors** | Offer 1-on-1 guidance, schedule sessions via Zoom, earn from expertise |
| **Admins** | Manage users, review applications, oversee finances and content |

## Key Features

- **Course Management** — Structured learning with modules, lessons, quizzes, and projects
- **Mentorship System** — 1-on-1 sessions with instant booking or request-based scheduling
- **Payment Processing** — Secure payments via Paystack with split revenue sharing
- **Group Buying** — Tiered discounts when students purchase courses together
- **AI Coach** — Personalized feedback on assignments and quiz answers
- **Certificates** — Verifiable certificates upon course completion
- **Blog & CMS** — Content management powered by Sanity
- **SEO Optimized** — Open Graph images, structured data, dynamic sitemaps

## Documentation Structure

This documentation is organized into two perspectives:

- **User Guide** — For students, tutors, mentors, and admins using the platform
- **Developer Guide** — For engineers building, maintaining, and extending the platform

Use the sidebar to navigate between sections, or use the search bar to find specific topics.
`,
      },
      {
        title: "Installation",
        slug: "installation",
        description:
          "Set up the PalmTechnIQ development environment from scratch.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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
NEXTAUTH_URL="http://localhost:3000"

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

The app will be available at \`http://localhost:3000\`.

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
        lastUpdated: "2026-04-16",
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
`,
      },
      {
        title: "Configuration",
        slug: "configuration",
        description: "Configure the platform settings and integrations.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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
- Tokens contain: userId, role, name, email, avatar

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
        lastUpdated: "2026-04-16",
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
        lastUpdated: "2026-04-16",
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
        lastUpdated: "2026-04-16",
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

| Party | Course Share | Mentorship Share |
|-------|-------------|-----------------|
| **Tutor/Mentor** | 50–70% | 70% |
| **Platform** | 20–50% | 30% |
| **Referrer** | Up to 10% | — |

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
- Tiered discounts based on group size:

| Group Size | Discount |
|-----------|---------|
| 3–5 | 10% |
| 6–10 | 15% |
| 11–20 | 20% |
| 21+ | 25% |

## Tax & VAT

- Automatic VAT calculation based on region
- Included in the final checkout amount
- Tracked per transaction

## For Developers

### Key Files
- \`actions/paystack.ts\` — Paystack server actions
- \`actions/checkout.ts\` — Checkout flow logic
- \`lib/payments/pricing.ts\` — VAT & split calculations
- \`lib/payments/promo.ts\` — Promo code validation
- \`lib/payments/finalizePaystack.ts\` — Post-payment processing
- \`components/paystack.tsx\` — Paystack popup component

### Webhook
- Endpoint: \`/api/webhook\`
- Validates Paystack signature (HMAC SHA-512)
- Processes \`charge.success\` events
- Creates enrollments, activates sessions, sends notifications
`,
      },
      {
        title: "User Management",
        slug: "user-management",
        description: "Roles, permissions, and user lifecycle.",
        audience: "all",
        lastUpdated: "2026-04-16",
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

## Registration Flow

1. User signs up via email/password or Google/GitHub OAuth
2. Email verification sent via Resend
3. User starts as \`USER\` role
4. Role changes based on actions:
   - Enrolling in a course → \`STUDENT\`
   - Tutor application approved → \`TUTOR\`
   - Admin assignment → \`ADMIN\` or \`MENTOR\`

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
- **OAuth** — Google sign-in supported
- **Email verification** — Required for full access

## For Developers

### Key Files
- \`auth.ts\` / \`auth.config.ts\` — Authentication configuration
- \`actions/auth.ts\` — Auth server actions (register, login, verify)
- \`actions/student-profile.ts\` — Student profile management
- \`actions/tutor-profile.ts\` — Tutor profile management
- \`app/(auth)/\` — Login, signup, and verification pages

### Session Data
JWT tokens include: \`userId\`, \`role\`, \`name\`, \`email\`, \`avatar\`

### Route Protection
Routes are categorized in \`routes.ts\`:
- \`publicRoutes\` — Accessible without login
- \`protectedRoutes\` — Require authentication
- \`adminRoutes\` — Require ADMIN role
- \`tutorRoutes\` — Require TUTOR role
`,
      },
      {
        title: "Email Notifications",
        slug: "email-notifications",
        description: "Email templates and notification system.",
        audience: "all",
        lastUpdated: "2026-04-16",
        content: `
# Email Notifications

PalmTechnIQ sends automated emails for key events using Resend as the email provider.

## Email Events

| Event | Recipient | Description |
|-------|-----------|-------------|
| Signup | User | Welcome email with verification link |
| Email Verification | User | Confirm email address |
| Password Reset | User | Reset password link |
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
        lastUpdated: "2026-04-16",
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

## For Developers

### Key Files
- \`actions/admin-dashboard.ts\` — Dashboard data fetching
- \`actions/admin-applications.ts\` — Application management
- \`actions/admin-enrollments.ts\` — Enrollment management
- \`actions/security-admin.ts\` — Security admin functions
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
        lastUpdated: "2026-04-16",
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
`,
      },
      {
        title: "Tutor Guide",
        slug: "tutor-guide",
        description: "Complete guide for tutors creating and managing courses.",
        audience: "non-developer",
        lastUpdated: "2026-04-16",
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
- Revenue split: You receive 50–70% of course sales

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
- **Analytics** — Detailed performance metrics
`,
      },
      {
        title: "Admin Guide",
        slug: "admin-guide",
        description: "Complete guide for platform administrators.",
        audience: "non-developer",
        lastUpdated: "2026-04-16",
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
        lastUpdated: "2026-04-16",
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
        lastUpdated: "2026-04-16",
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

## Core Models

### User & Profiles
- **User** — Central entity with auth, profile, banking, and wallet data
- **Student** — Education level, interests, goals, study tracking
- **Tutor** — Expertise, verifications, ratings, availability
- **Admin** — Privileges, department, and level

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

## Key Relationships

- A **User** can be a Student, Tutor, and/or Admin simultaneously
- **Courses** are owned by a User (tutor) and contain Modules → Lessons
- **Enrollments** connect Students to Courses with progress tracking
- **Transactions** link to Users and can contain multiple line items
- **MentorshipSessions** bridge Student and Tutor with Zoom integration
`,
      },
      {
        title: "Project Structure",
        slug: "project-structure",
        description: "File organization and directory conventions.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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
│   │   ├── mentorship/    # Mentorship pages
│   │   ├── student/       # Student dashboard
│   │   ├── tutor/         # Tutor dashboard
│   │   └── mentor/        # Mentor dashboard
│   ├── api/               # API routes (37+ endpoints)
│   └── studio/            # Sanity CMS Studio
├── actions/               # Server Actions (30+ files)
├── components/            # React Components
│   ├── ui/                # shadcn/ui primitives
│   ├── admin/             # Admin-specific components
│   ├── course/            # Course components
│   ├── mentorship/        # Mentorship components
│   ├── auth/              # Auth forms
│   └── shared/            # Shared/common components
├── lib/                   # Utilities & Integrations
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
        lastUpdated: "2026-04-16",
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
        lastUpdated: "2026-04-16",
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
        title: "Security",
        slug: "security",
        description: "Security measures, IP protection, and best practices.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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

## Payment Security

- **Webhook signature verification** — HMAC SHA-512 validation
- **Server-side payment processing** — No sensitive data on client
- **Amount verification** — Server validates expected amounts
- **Idempotent processing** — Duplicate webhook handling

## Key Files
- \`lib/ip-rate-limit.ts\` — IP-based rate limiting logic
- \`lib/rate-limit.ts\` — General rate limiting
- \`actions/security-admin.ts\` — Admin security functions
- \`next.config.mjs\` — Security headers
- \`auth.config.ts\` — Auth security configuration
`,
      },
      {
        title: "SEO Implementation",
        slug: "seo",
        description: "Search engine optimization strategy and implementation.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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
`,
      },
      {
        title: "Deployment",
        slug: "deployment",
        description: "Build, deploy, and maintain the platform.",
        audience: "developer",
        lastUpdated: "2026-04-16",
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
