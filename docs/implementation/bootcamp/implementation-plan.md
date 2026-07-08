# Palmtechniq Summer Bootcamp 2026: Subdomain Platform & Implementation Plan

> [!IMPORTANT]
> **Project Executive Summary**
> This document establishes the architectural blueprint, database schema strategy, design system specifications, and implementation workflow for the new **Palmtechniq Paid Summer Bootcamp 2026 Platform**. Acting as a dedicated subdomain portal (`bootcamp.palmtechniq.com` mapped via Next.js routing), this platform transforms standard bootcamp enrollment into an electrifying, high-conversion digital experience inspired by **Moonshot by TechCabal's Maximalist design language**.

---

## 1. Architectural & Subdomain Strategy

To allow the Summer Bootcamp to function as a standalone, high-impact brand while sharing the core Palmtechniq backend, user authentication, and AI infrastructure, we will implement a **Subdomain & Route Group Architecture**:

```mermaid
graph TD
    A[DNS / Edge Router] -->|palmtechniq.com| B[Main LMS Portal: app/\(root\)]
    A -->|bootcamp.palmtechniq.com| C[Bootcamp Portal: app/\(bootcamp\)]
    
    subgraph Bootcamp Subdomain Ecosystem
        C --> D[Maximalist Landing Page: /]
        C --> E[Track Curriculum Views: /tracks/:slug]
        C --> F[Hackathon Battlefield: /battlefield]
        C --> G[Paid Enrollment & Checkout: /enroll]
        C --> H[AI Bootcamp Advisor: /ai-advisor]
    end
    
    subgraph Shared Core Infrastructure
        G --> I[Paystack / Stripe Payment Gateway]
        H --> J[lib/ai/course-advisor.ts & lesson-chat.ts]
        C --> K[Prisma ORM & Auth System]
    end
```

### Routing Implementation
1. **Route Grouping**: Create an `app/(bootcamp)/` route group with a customized `layout.tsx` tailored specifically for the Maximalist bootcamp theme without interfering with the main LMS layout.
2. **Middleware Mapping**: Update Next.js `middleware.ts` to inspect the `host` header. If `bootcamp.palmtechniq.com` (or staging equivalent) is detected, rewrite requests cleanly to the `/(bootcamp)` route group.

---

## 2. Database Isolation & Scalability Architecture

> [!TIP]
> **Zero-Impact Scalability Guarantee**
> To guarantee that our bootcamp features never mutate, bloat, or disrupt the existing main platform LMS models (`Course`, `Lesson`, `Enrollment`, `User`), we will deploy **Dedicated Namespaced Models (`Bootcamp*`)** inside PostgreSQL.

### Why This Architecture is Future-Proof & Scalable:
1. **100% Decoupled from Main Courses**: Standard Palmtechniq courses and LMS enrollments remain completely untouched. Bootcamps have distinct requirements (live cohorts, tiered pricing, hackathons, team submissions) that would clutter the main `Course` model if merged.
2. **Multi-Cohort Reuse**: Since this subdomain will host *every* future bootcamp (Winter 2026, Summer 2027, etc.), the `Bootcamp` model acts as a top-level container defined by a unique `slug` (`summer-2026`).
3. **Optional User Linking**: Students can apply as guests with just their email/phone, or seamlessly link to an existing Palmtechniq `User` account via an optional foreign key (`userId`).

### Proposed Prisma Schema Extension (`prisma/schema.prisma`):

```prisma
// ==========================================
// BOOTCAMP SUBDOMAIN MODULE (ISOLATED)
// ==========================================

model Bootcamp {
  id             String              @id @default(cuid())
  slug           String              @unique // e.g., "summer-2026"
  title          String              // e.g., "Summer Bootcamp 2026"
  subtitle       String?
  description    String?
  startDate      DateTime?
  endDate        DateTime?
  isActive       Boolean             @default(true)
  maxSeats       Int?                @default(500)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  
  tracks         BootcampTrack[]
  tiers          BootcampTier[]
  enrollments    BootcampEnrollment[]
  teams          BootcampTeam[]

  @@map("bootcamps")
}

model BootcampTrack {
  id             String              @id @default(cuid())
  bootcampId     String
  name           String              // e.g., "AI & LLM Engineering"
  slug           String              // e.g., "ai-llm-engineering"
  description    String?
  icon           String?
  sortOrder      Int                 @default(0)
  curriculum     Json?               // Structured syllabus breakdown
  
  bootcamp       Bootcamp            @relation(fields: [bootcampId], references: [id], onDelete: Cascade)
  enrollments    BootcampEnrollment[]

  @@unique([bootcampId, slug])
  @@map("bootcamp_tracks")
}

model BootcampTier {
  id             String              @id @default(cuid())
  bootcampId     String
  name           String              // e.g., "Immersive Pro", "Virtual Scholar"
  price          Float               // e.g., 150000 NGN
  currency       String              @default("NGN")
  features       String[]
  isMostPopular  Boolean             @default(false)
  
  bootcamp       Bootcamp            @relation(fields: [bootcampId], references: [id], onDelete: Cascade)
  enrollments    BootcampEnrollment[]

  @@map("bootcamp_tiers")
}

enum BootcampEnrollmentStatus {
  PENDING_PAYMENT
  PAID_CONFIRMED
  SCHOLARSHIP_REVIEW
  REJECTED
  COMPLETED
}

model BootcampEnrollment {
  id              String                   @id @default(cuid())
  bootcampId      String
  trackId         String
  tierId          String
  userId          String?                  // Optional link to existing Palmtechniq User
  
  // Standalone applicant data (ensures zero dependency on main User table if unauthenticated)
  email           String
  fullName        String
  phoneNumber     String?
  occupation      String?
  experienceLevel String?
  
  status          BootcampEnrollmentStatus @default(PENDING_PAYMENT)
  paymentId       String?                  // Paystack/Stripe transaction reference
  amountPaid      Float                    @default(0)
  enrolledAt      DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt
  
  bootcamp        Bootcamp                 @relation(fields: [bootcampId], references: [id], onDelete: Cascade)
  track           BootcampTrack            @relation(fields: [trackId], references: [id], onDelete: Restrict)
  tier            BootcampTier             @relation(fields: [tierId], references: [id], onDelete: Restrict)
  user            User?                    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([bootcampId, email])
  @@index([status, enrolledAt])
  @@map("bootcamp_enrollments")
}

model BootcampTeam {
  id             String              @id @default(cuid())
  bootcampId     String
  name           String              // Team Name for Hackathon Demo Day
  projectTitle   String
  pitchDeckUrl   String?
  githubUrl      String?
  liveUrl        String?
  score          Float?
  
  bootcamp       Bootcamp            @relation(fields: [bootcampId], references: [id], onDelete: Cascade)

  @@map("bootcamp_teams")
}
```

---

## 3. Design System: Moonshot-Inspired Maximalism

To achieve the bold, sensory-rich aesthetics of [Moonshot by TechCabal](https://moonshot.techcabal.com/), our UI will reject minimal sterility in favor of **high-density visual hierarchy, oversize typography, layered glassmorphism, and electric neon contrast**, strictly utilizing the official Palmtechniq color tokens.

### A. Color Palette Mapping (`globals.css`)
We will deploy our brand and highlight tokens with intentional emotional resonance:

| Color Token | Hex Code | Maximalist UI Application |
| :--- | :--- | :--- |
| **Brand Teal** | `#00343d` | Deep background canvas, hero section gradients, and primary structure borders. |
| **Brand Green** | `#27ba55` | Electric CTA buttons, glowing neon borders (`.neon-border`), active live indicators, and progress bars. |
| **Brand Black** | `#000000` | High-contrast card backgrounds, section dividers, and terminal simulation blocks. |
| **Brand White** | `#ffffff` | Oversize headings, glassmorphism overlays (`bg-white/5`), and high-legibility body text. |
| **Highlight Blue** | `#84c8d4` | AI Advisor glowing badges, tech track tags (Cloud, AI/ML), and secondary interactive links. |
| **Highlight Yellow** | `#e4d406` | Live Countdown clock digits, scarcity badges ("56 Seats Left"), star ratings, and high-energy callout banners. |
| **Highlight Maroon** | `#800000` | Urgency tags ("Price Jump in 48h"), discounted strike-through pricing, and high-stakes Hackathon alert pills. |

### B. Core Maximalist UI Components
1. **Oversize Typographic Hero**:
   - Giant viewport-width headings (e.g., `text-6xl md:text-8xl font-black uppercase tracking-tighter`) utilizing CSS gradient clips (`.text-gradient`) and text outline strokes.
2. **The "Pulse" Live Countdown Ticker**:
   - Inspired by Moonshot's `56D : 56H : 56M : 56S` ticker. Formatted in glowing **Highlight Yellow (`#e4d406`)** inside a dark glassmorphic container with a subtle heartbeat pulse (`.animate-pulse-smooth`).
3. **High-Density Stat Ticker & Ticker Tapes**:
   - Infinite horizontal scrolling marquee tapes displaying high-energy metrics: `🚀 5,000+ ALUMNI • 💻 8 INTENSIVE TRACKS • 🏆 $10,000 DEMO DAY PRIZE POOL • 🤝 100% HIRING PARTNER NETWORK`.
4. **Interactive Card Grids (`.cyber-grid`)**:
   - Multi-layered cards with hover glow effects (`.hover-glow`), glowing borders (`.neon-border`), and instant visual feedback (`.lesson-click-flash`).

---

## 4. Dynamic Animations: Official GSAP Skills Integration

Following our `@.agents/skills/gsap-*` guidelines, all interactive motion will be choreographed using GSAP for buttery-smooth 60fps performance across devices.

```javascript
// Example: Choreographed Hero Timeline using gsap-react & gsap-timeline skills
useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.2 } });
  
  tl.from(".hero-badge", { y: -30, opacity: 0, scale: 0.8 })
    .from(".hero-title-word", { y: 100, opacity: 0, stagger: 0.15, rotateX: -45 }, "-=0.8")
    .from(".countdown-box", { scale: 0.5, opacity: 0, ease: "back.out(1.7)" }, "-=0.6")
    .from(".hero-cta-group", { y: 40, opacity: 0 }, "-=0.4");
}, { scope: heroRef });
```

### GSAP Strategy by Skill Module:
- **`gsap-react`**: Use `useGSAP()` with explicit container `refs` for automatic DOM cleanup on component unmounting, preventing memory leaks in Next.js transitions.
- **`gsap-scrolltrigger`**: Implement scroll-linked parallax on the Content Tracks grid and pin the "Hackathon Demo Day" section as the user scrolls through the curriculum.
- **`gsap-performance`**: Strictly animate transform properties (`x`, `y`, `scale`, `rotation`) and `opacity`. Avoid animating `width`, `margin`, or `padding` to eliminate layout thrashing.

---

## 5. Feature Blueprint & Page Structure

### Section 1: The Electric Hero & Countdown
- **Visuals**: Cyber-grid background with radial teal/green lights. Floating 3D-styled badges representing AI, Fullstack, and Data Science.
- **Headline**: *"COURAGE TO CODE. CONVICTION TO BUILD. SUMMER BOOTCAMP 2026."*
- **Action**: High-contrast **Brand Green** CTA: *"Secure Your Seat — Early Bird Ends Soon"* paired with the live yellow countdown ticker.

### Section 2: The 8 Intensive Content Tracks
Inspired by Moonshot's 9 content tracks, present bold, expandable cards for each bootcamp specialization:
1. **Full-Stack Software Engineering** (Next.js, TypeScript, Node.js)
2. **Artificial Intelligence & LLM Engineering** (Python, PyTorch, LangChain, OpenAI)
3. **Product Design & UI/UX Maximalism** (Figma, Design Systems, Motion Design)
4. **Cloud Infrastructure & DevOps** (AWS, Docker, Kubernetes, CI/CD)
5. **Data Science & Business Analytics** (SQL, PowerBI, Machine Learning)
6. **Cybersecurity & Ethical Hacking** (Network Defense, Penetration Testing)
7. **Mobile App Development** (React Native, Flutter)
8. **Product Management & Tech Leadership** (Agile, Roadmapping, Growth)

### Section 3: "Palmtechniq Battlefield" (Demo Day & Pitch Competition)
- Modeled after **TC Battlefield**.
- Highlights the end-of-bootcamp hackathon where student teams pitch live to venture capitalists, tech executives, and hiring partners for a **$10,000 cash prize pool** and direct incubation.

### Section 4: AI Bootcamp Advisor (`lib/ai` Integration)
- A dedicated interactive widget powered by our existing AI infrastructure (`course-advisor.ts`).
- **Interactive Prompt**: *"Not sure which track fits your career goals? Talk to our AI Bootcamp Advisor."*
- Features instant chat recommendations based on user background, time commitment, and salary expectations.

### Section 5: Transparent Tiered Pricing & Enrollment
Since this is a paid bootcamp, display 3 distinct maximalist pricing cards:

| Tier | Name | Target Audience | Key Features | Highlight Color |
| :---: | :--- | :--- | :--- | :---: |
| **Tier 1** | **Virtual Scholar** | Self-paced & remote learners | Full 12-week curriculum access, live weekly Q&A, Discord community, certificate of completion. | Highlight Blue |
| **Tier 2** | **Immersive Pro** *(Most Popular)* | Dedicated career switchers | Everything in Tier 1 + **1-on-1 weekly mentorship**, code reviews, Hackathon Battlefield entry, and resume overhaul. | Brand Green (Neon Glow) |
| **Tier 3** | **Executive & Placement** | Fast-track job seekers | Everything in Tier 2 + **Guaranteed internship placement support**, mock technical interviews with senior engineers, and VIP demo day networking. | Highlight Yellow |

---

## 6. Phased Execution Roadmap

```carousel
### Phase 1: Subdomain Routing & Maximalist Design Tokens
- [x] Set up `app/(bootcamp)` layout with dark mode background and cyber-grid utilities.
- [x] Implement Next.js host header middleware for `bootcamp.palmtechniq.com`.
- [x] Build reusable typography components (`TextGradient`, `NeonCard`, `PulseBadge`).
<!-- slide -->
### Phase 2: Core Landing Page & GSAP Motion
- [x] Develop Hero section with live countdown ticker and GSAP entrance timeline.
- [x] Build the 8 Content Tracks grid with ScrollTrigger reveal animations.
- [x] Implement the Hackathon Battlefield showcase and Mentorship grid.
<!-- slide -->
### Phase 3: AI Advisor & Payment Gateway Integration
- [ ] Connect `lib/ai/course-advisor.ts` to an interactive modal on the bootcamp landing page.
- [ ] Integrate Paystack/Stripe checkout flows for Tier 1, Tier 2, and Tier 3 paid enrollment.
- [ ] Connect successful checkout webhooks to Prisma ORM to provision student portal access.
<!-- slide -->
### Phase 4: Polish, Performance & SEO Audit
- [ ] Conduct 60fps GSAP performance audit using Chrome DevTools (ensure transform-only animations).
- [ ] Add structured JSON-LD SEO schemas for Course/Bootcamp events.
- [ ] End-to-end testing across mobile, tablet, and high-resolution desktop viewports.
````

---

## 7. Verification & Quality Gate
Before deploying to production, we will execute the following verification steps:
1. **Aesthetic Audit**: Confirm that the UI feels unmistakably vibrant, dynamic, and premium—matching Moonshot's visual density while respecting Palmtechniq's color codes (`#00343d`, `#27ba55`, `#e4d406`, `#84c8d4`, `#800000`).
2. **Animation Check**: Verify that all GSAP ScrollTriggers scrub smoothly without jitter and clean up properly when navigating between routes.
3. **Payment Integrity**: Test sandbox transactions for all pricing tiers to guarantee automatic enrollment state updates in the database.

> [!TIP]
> **Next Step for User Feedback**:
> Please review this implementation plan! Would you like us to start **Phase 1 (setting up the `app/(bootcamp)` route group and building the Maximalist Hero with the live countdown ticker)** immediately?
