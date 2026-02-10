## Production migration runbook

This runbook migrates data from the legacy Postgres schema
(`C:\Users\emeka\Codebase\ISCE\iscedemy\prisma\schema.prisma`)
into the current app schema
(`C:\Users\emeka\Codebase\palmtechniq\e-learning-platform\prisma\schema.prisma`)
with scheduled downtime.

### Preconditions

- Direct Postgres access to both old and new DBs.
- New app deployments are ready but not yet pointed to the new DB.
- The new DB has been initialized with Prisma migrations.
- A maintenance page or toggle is available on the old site.
- Paystack webhook can be paused or pointed to maintenance.

### Critical data mapping summary

- `users` -> `users` (ids preserved; fill missing `email`/`name`)
- `users` -> `students` (create for `role=STUDENT` or `hasStudentId=true`)
- `users` -> `tutors` (create for `role=TUTOR`; fill required fields)
- `accounts` -> `accounts`
- `courses` -> `courses` (create categories, map tutor as creator/owner)
- `curriculum/modules/lessons` -> `course_modules/lessons`
- `coursePayments` + progress-derived -> `enrollments`
- `progress` + `completedLessons` -> `lesson_progress`
- `projects` -> `projects`
- `projectSubmissions` -> `submissions`
- `reviews` -> `reviews`
- `transactions` + `coursePayments` -> `transactions`
- `certificates` -> `certificates`
- `courseRegistrations` -> `registrations`
- `awarenessProgramRegistrations` -> `program_registrations`
- `verificationTokens` -> `verification_tokens`
- `passwordResetTokens` -> `passwordResetTokens`

Not represented in the new schema (keep in `legacy` schema for reference):
- `events`, `eventPayments`
- `subscribers`
- `tutorApplications`
- `volunteerCertificates`

### Cutover steps (scheduled downtime)

1. Announce downtime and enable maintenance mode on the old site.
2. Disable Paystack webhook calls (or route to maintenance).
3. Take a full backup of the old DB:
   - `pg_dump --format=custom --file=legacy_backup.dump "$OLD_DATABASE_URL"`
4. Take a snapshot backup of the new DB (empty schema):
   - `pg_dump --format=custom --file=newdb_pre_migration.dump "$NEW_DATABASE_URL"`
5. Import the legacy schema into the new DB using FDW (see below).
6. Execute the migration SQL script:
   - `psql "$NEW_DATABASE_URL" -f scripts/migrations/old_to_new_migration.sql`
7. Run validation queries (see validation checklist below).
8. Point the app to the new DB and deploy.
9. Monitor logs and re-enable webhooks.

### FDW setup (new DB)

Run this once in the new DB to make legacy tables available
under the `legacy` schema. Use placeholders for credentials.

```
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
CREATE SCHEMA IF NOT EXISTS legacy;

CREATE SERVER legacy_db
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host '<OLD_DB_HOST>', dbname '<OLD_DB_NAME>', port '5432');

CREATE USER MAPPING FOR CURRENT_USER
SERVER legacy_db
OPTIONS (user '<OLD_DB_USER>', password '<OLD_DB_PASSWORD>');

IMPORT FOREIGN SCHEMA public
FROM SERVER legacy_db
INTO legacy;
```

### Validation checklist (minimum)

- Users: total count, students count, tutors count, null email check.
- Courses: count, tutors assigned, categories created.
- Enrollments: count and duplicates check.
- Lesson progress: count and unique (userId, lessonId).
- Reviews: count.
- Transactions: count and status distribution.

Example validation queries (new DB):
```
SELECT COUNT(*) AS users_total FROM users;
SELECT COUNT(*) AS students_total FROM students;
SELECT COUNT(*) AS tutors_total FROM tutors;
SELECT COUNT(*) AS courses_total FROM courses;
SELECT COUNT(*) AS enrollments_total FROM enrollments;
SELECT COUNT(*) AS lesson_progress_total FROM lesson_progress;
SELECT COUNT(*) AS transactions_total FROM transactions;
SELECT COUNT(*) AS reviews_total FROM reviews;
SELECT COUNT(*) AS registrations_total FROM registrations;
SELECT COUNT(*) AS program_registrations_total FROM program_registrations;
SELECT COUNT(*) AS legacy_duplicate_emails FROM migration.duplicate_emails;
```

### Rollback plan

- Re-point the app to the old DB.
- Restore DNS to the old deployment.
- Keep the legacy backup for postmortem analysis.
