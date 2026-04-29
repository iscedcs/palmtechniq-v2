-- Add lessonId as nullable first
ALTER TABLE "quiz" ADD COLUMN "lessonId" TEXT;

-- Backfill lessonId with the last lesson in each module
WITH ranked_lessons AS (
  SELECT
    q.id AS quiz_id,
    l.id AS lesson_id,
    ROW_NUMBER() OVER (
      PARTITION BY q.id
      ORDER BY l."sortOrder" DESC, l."createdAt" DESC
    ) AS rn
  FROM "quiz" q
  JOIN "lessons" l ON l."moduleId" = q."moduleId"
)
UPDATE "quiz" q
SET "lessonId" = rl.lesson_id
FROM ranked_lessons rl
WHERE q.id = rl.quiz_id
  AND rl.rn = 1;

-- If any quizzes still have null lessonId, block and investigate
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "quiz" WHERE "lessonId" IS NULL) THEN
    RAISE EXCEPTION 'quiz.lessonId is NULL for some rows; ensure each module has at least one lesson.';
  END IF;
END $$;

-- Drop moduleId foreign key and unique index
ALTER TABLE "quiz" DROP CONSTRAINT IF EXISTS "quiz_moduleId_fkey";

DROP INDEX IF EXISTS "quiz_moduleId_key";

-- Enforce lesson-based relation
ALTER TABLE "quiz" ALTER COLUMN "lessonId" SET NOT NULL;

CREATE UNIQUE INDEX "quiz_lessonId_key" ON "quiz" ("lessonId");

ALTER TABLE "quiz"
ADD CONSTRAINT "quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove moduleId column
ALTER TABLE "quiz" DROP COLUMN "moduleId";