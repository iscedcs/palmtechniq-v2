-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvisorFollowUpStatus') THEN
    CREATE TYPE "AdvisorFollowUpStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "advisor_sessions" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advisor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "advisor_turns" (
  "id" TEXT NOT NULL,
  "advisorSessionId" TEXT NOT NULL,
  "userMessage" TEXT NOT NULL,
  "assistantMessage" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "advisor_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "advisor_recommendations" (
  "id" TEXT NOT NULL,
  "advisorTurnId" TEXT NOT NULL,
  "courseId" TEXT,
  "categoryId" TEXT,
  "reason" TEXT NOT NULL,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "advisor_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "advisor_follow_ups" (
  "id" TEXT NOT NULL,
  "advisorSessionId" TEXT NOT NULL,
  "advisorTurnId" TEXT,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "note" TEXT,
  "status" "AdvisorFollowUpStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advisor_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "advisor_sessions_sessionToken_key" ON "advisor_sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "advisor_sessions_userId_idx" ON "advisor_sessions"("userId");
CREATE INDEX IF NOT EXISTS "advisor_turns_advisorSessionId_createdAt_idx" ON "advisor_turns"("advisorSessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "advisor_recommendations_advisorTurnId_rank_idx" ON "advisor_recommendations"("advisorTurnId", "rank");
CREATE INDEX IF NOT EXISTS "advisor_recommendations_courseId_idx" ON "advisor_recommendations"("courseId");
CREATE INDEX IF NOT EXISTS "advisor_recommendations_categoryId_idx" ON "advisor_recommendations"("categoryId");
CREATE INDEX IF NOT EXISTS "advisor_follow_ups_advisorSessionId_createdAt_idx" ON "advisor_follow_ups"("advisorSessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "advisor_follow_ups_status_createdAt_idx" ON "advisor_follow_ups"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "advisor_follow_ups_email_idx" ON "advisor_follow_ups"("email");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_sessions_userId_fkey'
  ) THEN
    ALTER TABLE "advisor_sessions"
      ADD CONSTRAINT "advisor_sessions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_turns_advisorSessionId_fkey'
  ) THEN
    ALTER TABLE "advisor_turns"
      ADD CONSTRAINT "advisor_turns_advisorSessionId_fkey"
      FOREIGN KEY ("advisorSessionId") REFERENCES "advisor_sessions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_recommendations_advisorTurnId_fkey'
  ) THEN
    ALTER TABLE "advisor_recommendations"
      ADD CONSTRAINT "advisor_recommendations_advisorTurnId_fkey"
      FOREIGN KEY ("advisorTurnId") REFERENCES "advisor_turns"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_recommendations_courseId_fkey'
  ) THEN
    ALTER TABLE "advisor_recommendations"
      ADD CONSTRAINT "advisor_recommendations_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "courses"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_recommendations_categoryId_fkey'
  ) THEN
    ALTER TABLE "advisor_recommendations"
      ADD CONSTRAINT "advisor_recommendations_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_follow_ups_advisorSessionId_fkey'
  ) THEN
    ALTER TABLE "advisor_follow_ups"
      ADD CONSTRAINT "advisor_follow_ups_advisorSessionId_fkey"
      FOREIGN KEY ("advisorSessionId") REFERENCES "advisor_sessions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_follow_ups_advisorTurnId_fkey'
  ) THEN
    ALTER TABLE "advisor_follow_ups"
      ADD CONSTRAINT "advisor_follow_ups_advisorTurnId_fkey"
      FOREIGN KEY ("advisorTurnId") REFERENCES "advisor_turns"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisor_follow_ups_userId_fkey'
  ) THEN
    ALTER TABLE "advisor_follow_ups"
      ADD CONSTRAINT "advisor_follow_ups_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
