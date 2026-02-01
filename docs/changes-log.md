## Change Log: Tasks, Quizzes, Projects, Student Profile

### Overview
This document captures the scope of changes made to restructure learning flows, add task management, move quizzes to lessons, and enhance student profile functionality. It includes the original problem, solution direction, and execution details.

---

## 1) Learning Flow Restructure (Tasks, Quizzes, Projects)

### Problem
- The system had overlapping concepts (quizzes, projects, assignments) that could be attached to modules or courses, leading to confusion and unclear gating.
- Quiz gating was module-based, but the desired flow required lesson-level gating.
- Assignments (now called Tasks) needed to be module-based, while Projects needed to be course-based capstones only.

### Solution
- **Quizzes** are lesson-based and gate progression between lessons.
- **Tasks** are module-based and must be submitted before moving to the next module.
- **Projects** are course-based capstones only (used for certificate eligibility).

### Execution Summary
- Added `Task` and `TaskSubmission` models, plus `TaskSubmissionType`.
- Added `ProjectScope` enum to enforce course-only projects.
- Migrated module-level projects into tasks.
- Migrated quizzes to be lesson-based (`lessonId` instead of `moduleId`).
- Updated gating in lesson completion + quiz submission flow.
- Updated student/tutor task UIs.

### Key Files Updated
#### Database & Migration
- `prisma/schema.prisma`
  - `Task`, `TaskSubmission`, `TaskSubmissionType`
  - `Project.scope`
  - `Resource.taskId`
  - `Lesson.quiz` relation
- `prisma/migrations/001_quiz_lesson/migration.sql`
  - Backfills `quiz.lessonId` from last lesson in module.
- `scripts/migrate-module-projects-to-tasks.ts`
  - Migrates module-based projects to tasks/submissions.

#### Data & API
- `actions/assignment.ts`
  - Task CRUD, submissions, grading.
  - Task notifications.
  - Task completion unlocks next module when quiz+lessons are done.
- `actions/project.ts`
  - Projects filtered to `scope: COURSE`.
  - Removed module-based project creation logic.
- `actions/student-projects.ts`
  - Only course-level projects are eligible now.
- `app/api/quiz/[quizId]/submit/route.ts`
  - Lesson-based quiz logic + task gating.
- `app/api/lessons/[lessonId]/complete/route.ts`
  - Lesson completion returns task requirement.

#### UI
- `app/(root)/student/assignments/page.tsx`
  - Replaced mocks with real data and submissions.
- `app/(root)/tutor/tasks/page.tsx`
  - Tutor task management + grading.
- `components/pages/courses/courseId/learn/course-learning-page.tsx`
  - Updated lesson unlock logic (quiz pass required).
  - Removes auto quiz redirect; uses start button.
- `components/pages/courses/courseId/learn/lessonTabs.tsx`
  - Start Quiz button appears after lesson completion.
- `components/pages/courses/courseId/quiz/[quizId]/quiz-client.tsx`
  - Task requirement redirect to assignments.
- `components/tutor/projects/create-project-modal.tsx`
  - Course-only project creation.

---

## 2) Student Profile Enhancements

### Problem
- Profile page used mock data and lacked real persistence.
- No control over notification preferences.
- Email field should be read-only for authenticity.
- Missing profile image upload.

### Solution
- Load profile data from DB.
- Persist profile updates and preferences.
- Lock email editing.
- Add avatar upload to S3 and save URL.

### Execution Summary
- New actions for profile + preferences.
- Integrated real stats and preferences.
- Implemented image upload flow.
- Added notifications gating tied to user preferences.

### Key Files Updated
- `app/(root)/student/profile/page.tsx`
  - Fetch/submit profile data.
  - Read-only email.
  - Preferences save.
  - Avatar upload.
  - Loading/error states.
- `actions/student-profile.ts`
  - Get/update profile data.
  - Add student goal.
  - Update avatar.
- `actions/user-preferences.ts`
  - Read/write preferences.
- `lib/user-preferences.ts`
  - Defaults and type.
- `lib/websocket/websocket-provider.tsx`
  - Preferences-gated notification display.
- `lib/feature-settings-config.tsx`
  - Notification/privacy toggles definitions.

---

## 3) Notifications & Metadata Categories

### Problem
- Notifications were emitted but not categorized for user preference gating.

### Solution
- Add `metadata.category` to notification payloads.
- Use preferences to decide whether to show notifications.

### Execution Summary
Updated emitters to include categories:
- `actions/cart.ts` → `cart`
- `actions/course.ts` → `course_update`
- `actions/tutor-actions.ts` → `course_created`, `course_published`, `course_update`
- `lib/payments/finalizePaystack.ts` → `payment_success`, `payment_received`
- `actions/assignment.ts` → `task_created`, `task_submitted`, `task_graded`

---

## 4) Prisma & Migration Recovery

### Problem
- Drift detected and no migrations existed.
- Baseline migration generated from current schema contained a stray log line.
- `quiz.moduleId` in DB caused app errors after lesson-based quiz update.

### Solution
- Created baseline migration and marked it applied.
- Repaired baseline SQL and checksum.
- Applied lesson-quiz migration without data loss.
- Regenerated Prisma client.

### Execution Summary
- Created `prisma/migrations/000_baseline/migration.sql`.
- Fixed the baseline SQL (removed stray log line).
- Re-applied baseline entry in `_prisma_migrations`.
- Applied `001_quiz_lesson` migration.
- Ran `pnpm prisma generate`.

---

## Current Architecture Summary
- **Quiz**: Lesson-based, must pass to unlock next lesson.
- **Task**: Module-based, must submit to unlock next module.
- **Project**: Course-based capstone only.

---

## Outstanding/Follow-up Items
- Confirm all lesson quizzes are mapped correctly after migration.
- Consider adding a reporting query to validate quiz/lesson links.
- Consider adding UI for task creation (tutor) beyond current minimal view.

