-- Migration: legacy (old) schema -> new app schema
-- Assumes legacy tables are accessible under schema "legacy" via postgres_fdw.
-- Run in the NEW database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS migration;

-- Track duplicate emails from legacy users
DROP TABLE IF EXISTS migration.duplicate_emails;

CREATE TABLE migration.duplicate_emails AS
SELECT email, array_agg (id) AS legacy_ids
FROM legacy.users
WHERE
    email IS NOT NULL
GROUP BY
    email
HAVING
    COUNT(*) > 1;

-- Users
INSERT INTO users (
  "id",
  "email",
  "name",
  "avatar",
  "role",
  "isActive",
  "createdAt",
  "updatedAt",
  "bio",
  "location",
  "website",
  "socialLinks",
  "preferences",
  "timezone",
  "language",
  "emailVerified",
  "phone",
  "password",
  "isVerified",
  "verificationToken",
  "bank_name",
  "account_number",
  "subaccount_code",
  "recipient_code",
  "walletBalance",
  "image"
)
SELECT
  u.id,
  CASE
    WHEN u.email IS NULL OR u.email = '' THEN 'legacy+' || u.id || '@example.local'
    WHEN EXISTS (
      SELECT 1 FROM migration.duplicate_emails d WHERE d.email = u.email
    ) THEN 'legacy+' || u.id || '@example.local'
    ELSE u.email
  END AS email,
  COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1), 'Legacy User') AS name,
  u.image AS avatar,
  COALESCE(u.role::text, 'USER')::"UserRole" AS role,
  TRUE AS "isActive",
  COALESCE(u.email_verified, now()) AS "createdAt",
  now() AS "updatedAt",
  u.description AS bio,
  NULL AS location,
  NULL AS website,
  NULL AS "socialLinks",
  NULL AS preferences,
  NULL AS timezone,
  'en' AS language,
  u.email_verified AS "emailVerified",
  u.phone,
  u.password,
  u."isVerified",
  u."verificationToken",
  u."bank_name",
  u."account_number",
  u."subaccount_code",
  u."recipient_code",
  u."walletBalance",
  NULL AS image
FROM legacy.users u
ON CONFLICT ("id") DO NOTHING;

-- Students (create from legacy users)
INSERT INTO students (
  "id",
  "userId",
  "level",
  "interests",
  "goals",
  "studyHours",
  "completedHours",
  "streak",
  "lastActiveDate",
  "totalPoints",
  "currentRank",
  "hasStudentId",
  "coursesStarted",
  "coursesCompleted",
  "averageScore",
  "totalAssignments"
)
SELECT
  gen_random_uuid()::text,
  u.id,
  'BEGINNER'::"EducationLevel",
  ARRAY[]::text[],
  ARRAY[]::text[],
  0,
  0,
  0,
  NULL,
  0,
  'Novice',
  u."hasStudentId",
  0,
  0,
  NULL,
  0
FROM legacy.users u
WHERE u.role::text = 'STUDENT' OR u."hasStudentId" = TRUE
ON CONFLICT ("userId") DO NOTHING;

-- Tutors (create from legacy users)
INSERT INTO tutors (
  "id",
  "userId",
  "title",
  "expertise",
  "experience",
  "education",
  "certifications",
  "hourlyRate",
  "isVerified",
  "verifiedAt",
  "course",
  "totalStudents",
  "totalCourses",
  "totalEarnings",
  "averageRating",
  "totalReviews",
  "responseTime",
  "completionRate",
  "availability",
  "timezone"
)
SELECT
  gen_random_uuid()::text,
  u.id,
  COALESCE(NULLIF(u.position, ''), 'Tutor'),
  ARRAY[]::text[],
  0,
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  u."isVerified",
  NULL,
  u.courses,
  0,
  0,
  0,
  0,
  0,
  24,
  0,
  NULL,
  NULL
FROM legacy.users u
WHERE u.role::text = 'TUTOR'
ON CONFLICT ("userId") DO NOTHING;

-- Accounts
INSERT INTO
    accounts (
        "id",
        "userId",
        "type",
        "provider",
        "providerAccountId",
        "refresh_token",
        "access_token",
        "expires_at",
        "token_type",
        "scope",
        "id_token",
        "session_state"
    )
SELECT a.id, a.user_id, a.type, a.provider, a.provider_account_id, a.refresh_token, a.access_token, a.expires_at, a.token_type, a.scope, a.id_token, a.session_state
FROM legacy.accounts a ON CONFLICT ("id") DO NOTHING;

-- Categories
INSERT INTO categories (
  "id",
  "name",
  "slug",
  "description",
  "icon",
  "color",
  "isActive",
  "sortOrder",
  "parentId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  c.category,
  lower(regexp_replace(c.category, '[^a-zA-Z0-9]+', '-', 'g')),
  NULL,
  NULL,
  NULL,
  TRUE,
  0,
  NULL,
  now(),
  now()
FROM (
  SELECT DISTINCT category FROM legacy."Course" WHERE category IS NOT NULL
) c
ON CONFLICT ("slug") DO NOTHING;

-- Courses
INSERT INTO courses (
  "id",
  "title",
  "slug",
  "description",
  "thumbnail",
  "trailer",
  "price",
  "salePrice",
  "currency",
  "level",
  "status",
  "language",
  "duration",
  "totalLessons",
  "totalQuizzes",
  "totalProjects",
  "requirements",
  "outcomes",
  "targetAudience",
  "metaTitle",
  "metaDescription",
  "publishedAt",
  "createdAt",
  "updatedAt",
  "virtualPrice",
  "physicalPrice",
  "certificate",
  "categoryId",
  "creatorId",
  "ownerId",
  "basePrice",
  "currentPrice",
  "demandLevel",
  "flashSaleEnd",
  "groupBuyingDiscount",
  "groupBuyingEnabled",
  "isFlashSale",
  "previewVideo",
  "subtitle",
  "tutorId",
  "allowDiscussions"
)
SELECT
  c.id,
  c.title,
  lower(regexp_replace(c.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(c.id, 1, 6),
  c.description,
  c.image,
 c."videoUrl",
  COALESCE(c."virtualPrice", c."physicalPrice", 0),
  NULL,
  'NGN',
  'BEGINNER'::"CourseLevel",
  'PUBLISHED'::"CourseStatus",
  'en',
  NULL,
  0,
  0,
  0,
  ARRAY[]::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  c."textSnippet",
  c."createdAt",
  c."createdAt",
  c."updatedAt",
  c."virtualPrice",
  c."physicalPrice",
  c.certificate,
  cat.id,
  c."tutorId",
  c."tutorId",
  c."virtualPrice",
  COALESCE(c."virtualPrice", c."physicalPrice", 0),
  NULL,
  NULL,
  NULL,
  FALSE,
  FALSE,
 c."videoUrl",
  COALESCE(NULLIF(c."textSnippet", ''), c.title),
  c."tutorId",
  FALSE
FROM legacy."Course" c
JOIN categories cat ON cat.name = c.category
ON CONFLICT ("id") DO NOTHING;

-- Course modules (from legacy modules)
INSERT INTO course_modules (
  "id",
  "title",
  "description",
  "sortOrder",
  "duration",
  "isPublished",
  "courseId",
  "createdAt",
  "updatedAt",
  "content"
)
SELECT
  m.id,
  m."headingName",
  m."headingDescription",
  m."order",
  COALESCE(NULLIF(regexp_replace(m.duration, '\\D', '', 'g'), '')::int, 0),
  TRUE,
  cur."courseId",
  m."createdAt",
  m."updatedAt",
  NULL
FROM legacy."Module" m
JOIN legacy."Curriculum" cur ON cur.id = m."curriculumId"
ON CONFLICT ("id") DO NOTHING;

-- Lessons
INSERT INTO lessons (
  "id",
  "title",
  "description",
  "content",
  "videoUrl",
  "duration",
  "sortOrder",
  "isLocked",
  "isPreview",
  "lessonType",
  "moduleId",
  "createdAt",
  "updatedAt"
)
SELECT
  l.id,
  l.title,
  l.description,
  NULL,
  l."videoUrl",
  COALESCE(NULLIF(regexp_replace(l.duration, '\\D', '', 'g'), '')::int, 0),
  l."order",
  FALSE,
  FALSE,
  'VIDEO'::"LessonType",
  l."moduleId",
  l."createdAt",
  l."updatedAt"
FROM legacy."Lesson" l
ON CONFLICT ("id") DO NOTHING;

-- Enrollments source (payments + progress-derived)
DROP TABLE IF EXISTS migration.enrollment_source;

CREATE TABLE migration.enrollment_source AS
SELECT DISTINCT cp."userId" AS user_id, cp."courseId" AS course_id
FROM legacy."CoursePayment" cp
UNION
SELECT DISTINCT p."userId", cur."courseId"
FROM legacy."Progress" p
JOIN legacy."Lesson" l ON l.id = p."lessonId"
JOIN legacy."Module" m ON m.id = l."moduleId"
JOIN legacy."Curriculum" cur ON cur.id = m."curriculumId";

DROP TABLE IF EXISTS migration.enrollment_map;

CREATE TABLE migration.enrollment_map AS
SELECT user_id, course_id, gen_random_uuid()::text AS enrollment_id
FROM migration.enrollment_source;

INSERT INTO enrollments (
  "id",
  "progress",
  "status",
  "completedAt",
  "certificateIssued",
  "userId",
  "courseId",
  "groupPurchaseId",
  "enrolledAt",
  "updatedAt"
)
SELECT
  em.enrollment_id,
  0,
  'ACTIVE'::"EnrollmentStatus",
  NULL,
  FALSE,
  em.user_id,
  em.course_id,
  NULL,
  now(),
  now()
FROM migration.enrollment_map em
ON CONFLICT ("id") DO NOTHING;

-- Lesson progress (from legacy progress)
INSERT INTO lesson_progress (
  "id",
  "isCompleted",
  "watchTime",
  "completedAt",
  "userId",
  "lessonId",
  "enrollmentId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  p.completed,
  0,
  NULL,
  p."userId",
  p."lessonId",
  em.enrollment_id,
  p."createdAt",
  p."updatedAt"
FROM legacy."Progress" p
JOIN legacy."Lesson" l ON l.id = p."lessonId"
JOIN legacy."Module" m ON m.id = l."moduleId"
JOIN legacy."Curriculum" cur ON cur.id = m."curriculumId"
JOIN migration.enrollment_map em
  ON em.user_id = p."userId" AND em.course_id = cur."courseId"
ON CONFLICT ("userId", "lessonId") DO UPDATE
SET "isCompleted" = EXCLUDED."isCompleted";

-- Completed lessons -> ensure completed state
INSERT INTO lesson_progress (
  "id",
  "isCompleted",
  "watchTime",
  "completedAt",
  "userId",
  "lessonId",
  "enrollmentId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  TRUE,
  0,
  c."completedAt",
  c."userId",
  c."lessonId",
  em.enrollment_id,
  c."completedAt",
  c."completedAt"
FROM legacy."CompletedLesson" c
JOIN legacy."Lesson" l ON l.id = c."lessonId"
JOIN legacy."Module" m ON m.id = l."moduleId"
JOIN legacy."Curriculum" cur ON cur.id = m."curriculumId"
JOIN migration.enrollment_map em
  ON em.user_id = c."userId" AND em.course_id = cur."courseId"
ON CONFLICT ("userId", "lessonId") DO UPDATE
SET
  "isCompleted" = TRUE,
  "completedAt" = COALESCE(EXCLUDED."completedAt", lesson_progress."completedAt");

-- Projects
INSERT INTO projects (
  "id",
  "title",
  "description",
  "requirements",
  "difficulty",
  "points",
  "dueDate",
  "isActive",
  "scope",
  "courseId",
  "moduleId",
  "createdAt",
  "updatedAt"
)
SELECT
  p.id,
  p.title,
  p.description,
  ARRAY[]::text[],
  'BEGINNER'::"CourseLevel",
  100,
  p."dueDate",
  TRUE,
  'COURSE'::"ProjectScope",
  p."courseId",
  NULL,
  p."createdAt",
  p."updatedAt"
FROM legacy."Project" p
ON CONFLICT ("id") DO NOTHING;

-- Project submissions -> submissions
INSERT INTO submissions (
  "id",
  "content",
  "fileUrl",
  "githubUrl",
  "liveUrl",
  "notes",
  "status",
  "score",
  "feedback",
  "gradedAt",
  "userId",
  "projectId",
  "createdAt",
  "updatedAt"
)
SELECT
  s.id,
  s.content,
  s."fileUrl",
  NULL,
  NULL,
  NULL,
  'SUBMITTED'::"SubmissionStatus",
  NULL,
  s.feedback,
  NULL,
  s."userId",
  s."projectId",
  s."createdAt",
  s."updatedAt"
FROM legacy."ProjectSubmission" s
ON CONFLICT ("id") DO NOTHING;

-- Reviews
INSERT INTO reviews (
  "id",
  "rating",
  "comment",
  "isPublic",
  "responseText",
  "respondedAt",
  "userId",
  "courseId",
  "tutorName",
  "reviewerName",
  "createdAt",
  "updatedAt"
)
SELECT
  r.id,
  r.rating,
  COALESCE(NULLIF(r.description, ''), r.title),
  TRUE,
  NULL,
  NULL,
  r."userId",
  r."courseId",
  r."tutorName",
  r."reviewerName",
  r."createdAt",
  r."updatedAt"
FROM legacy."Review" r
ON CONFLICT ("userId", "courseId") DO NOTHING;

-- Transactions (from course payments)
INSERT INTO transactions (
  "id",
  "amount",
  "currency",
  "status",
  "paymentMethod",
  "paymentId",
  "description",
  "metadata",
  "userId",
  "courseId",
  "groupPurchaseId",
  "transactionId",
  "paymentDate",
  "verifiedAt",
  "bank_name_used",
  "account_number_used",
  "recipient_code_used",
  "wallet_balance_used",
  "isBankTransaction",
  "createdAt",
  "updatedAt"
)
SELECT
  cp.id,
  cp.amount,
  cp.currency,
  CASE cp.status::text
    WHEN 'SUCCESSFUL' THEN 'COMPLETED'
    WHEN 'FAILED' THEN 'FAILED'
    ELSE 'PENDING'
  END::"TransactionStatus",
  NULL,
  cp."transactionId",
  'Legacy course payment',
  NULL,
  cp."userId",
  cp."courseId",
  NULL,
  cp."transactionId",
  cp."paymentDate",
  cp."verifiedAt",
  NULL,
  NULL,
  NULL,
  NULL,
  FALSE,
  cp."paymentDate",
  cp."verifiedAt"
FROM legacy."CoursePayment" cp
ON CONFLICT ("id") DO NOTHING;

-- Transactions (from legacy transactions)
INSERT INTO transactions (
  "id",
  "amount",
  "currency",
  "status",
  "paymentMethod",
  "paymentId",
  "description",
  "metadata",
  "userId",
  "courseId",
  "groupPurchaseId",
  "transactionId",
  "paymentDate",
  "verifiedAt",
  "bank_name_used",
  "account_number_used",
  "recipient_code_used",
  "wallet_balance_used",
  "isBankTransaction",
  "createdAt",
  "updatedAt"
)
SELECT
  t.id,
  t.amount,
  'NGN',
  CASE lower(t.status)
    WHEN 'successful' THEN 'COMPLETED'
    WHEN 'failed' THEN 'FAILED'
    WHEN 'completed' THEN 'COMPLETED'
    ELSE 'PENDING'
  END::"TransactionStatus",
  NULL,
  NULL,
  t.type,
  NULL,
  t."userId",
  t."courseId",
  NULL,
  t.id,
  t."createdAt",
  t."createdAt",
  NULL,
  NULL,
  NULL,
  NULL,
  FALSE,
  t."createdAt",
  t."createdAt"
FROM legacy."Transaction" t
ON CONFLICT ("id") DO NOTHING;

-- Certificates
INSERT INTO certificates (
  "id",
  "certificateId",
  "title",
  "description",
  "imageUrl",
  "issuedAt",
  "expiresAt",
  "isRevoked",
  "userId",
  "courseId",
  "studentName",
  "issuedDate",
  "certificateUrl",
  "createdAt",
  "updatedAt"
)
SELECT
  c.id,
  c.id,
  c.type::text,
  c.platform,
  NULL,
  c."issuedDate",
  NULL,
  FALSE,
  c."userId",
  c."courseId",
  c."studentName",
  c."issuedDate",
  c."certificateUrl",
  c."issuedDate",
  c."issuedDate"
FROM legacy."Certificate" c
ON CONFLICT ("id") DO NOTHING;

-- Mentorship sessions
INSERT INTO mentorship_sessions (
  "id",
  "title",
  "description",
  "duration",
  "price",
  "status",
  "meetingUrl",
  "notes",
  "feedback",
  "rating",
  "scheduledAt",
  "startedAt",
  "endedAt",
  "studentId",
  "tutorId",
  "createdAt",
  "updatedAt"
)
SELECT
  m.id,
  COALESCE(m.topic, 'Mentorship session'),
  m.topic,
  m.duration,
  0,
  CASE WHEN m.completed THEN 'COMPLETED' ELSE 'SCHEDULED' END::"SessionStatus",
  m."meetingUrl",
  m.notes,
  NULL,
  NULL,
  m."scheduledAt",
  NULL,
  NULL,
  m."menteeId",
  m."mentorId",
  m."createdAt",
  m."updatedAt"
FROM legacy."Mentorship" m
WHERE m."menteeId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- Registrations
INSERT INTO registrations (
  "id",
  "firstname",
  "lastname",
  "email",
  "occupation",
  "course",
  "type",
  "phone",
  "createdAt",
  "updatedAt"
)
SELECT
  r.id,
  r.firstname,
  r.lastname,
  r.email,
  r.occupation,
  r.course,
  r.type,
  r.phone,
  now(),
  now()
FROM legacy."courseRegistrations" r
ON CONFLICT ("email") DO NOTHING;

-- Program registrations
INSERT INTO program_registrations (
  "id",
  "fullName",
  "age",
  "dateOfBirth",
  "phoneNumber",
  "email",
  "goals",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  p.id,
  p."fullName",
  p.age,
  p."dateOfBirth",
  p."phoneNumber",
  p.email,
  p.goals,
  p.status,
  p."createdAt",
  p."updatedAt"
FROM legacy."awarenessProgramRegistrations" p
ON CONFLICT ("email") DO NOTHING;

-- Verification tokens
INSERT INTO verification_tokens (
  "id",
  "email",
  "token",
  "expires"
)
SELECT
  v.id,
  v.email,
  v.token,
  v.expires
FROM legacy."VerificationToken" v
ON CONFLICT ("id", "token", "email") DO NOTHING;

-- Password reset tokens
INSERT INTO "PasswordResetToken" (
  "id",
  "email",
  "token",
  "expires"
)
SELECT
  p.id,
  p.email,
  p.token,
  p.expires
FROM legacy."PasswordResetToken" p
ON CONFLICT ("email") DO NOTHING;