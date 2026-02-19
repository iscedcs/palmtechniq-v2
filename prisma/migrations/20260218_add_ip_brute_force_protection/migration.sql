-- Add brute force protection fields to users table
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "accountLockedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "lastLoginIp" TEXT;
ALTER TABLE "users" ADD COLUMN "lastFailedLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "lastFailedLoginIp" TEXT;

-- Create login_attempts table for tracking login attempts
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "email" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- Create indexes on login_attempts for performance
CREATE INDEX "login_attempts_ipAddress_idx" ON "login_attempts"("ipAddress");
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");
CREATE INDEX "login_attempts_createdAt_idx" ON "login_attempts"("createdAt");

-- Create ip_blacklist table for blocking malicious IPs
CREATE TABLE "ip_blacklist" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unblockedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ip_blacklist_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes for ip_blacklist
CREATE UNIQUE INDEX "ip_blacklist_ipAddress_key" ON "ip_blacklist"("ipAddress");
CREATE INDEX "ip_blacklist_ipAddress_idx" ON "ip_blacklist"("ipAddress");
