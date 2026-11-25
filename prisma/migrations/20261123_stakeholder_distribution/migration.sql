-- Stakeholder distribution: splits the platform's retained revenue between
-- the stakeholders, per period rather than per sale.
--
-- Ten ledger rows on every transaction would multiply row count by ten for
-- amounts too small to ever transfer (a NGN 90,000 course owes each 2% holder
-- about NGN 1,300). One run a month produces ten rows a month.
--
-- Money is stored as integer kobo here. The older money columns in this schema
-- are Float, which is a known defect; these new ones do not inherit it.
--
-- Additive only: three new tables and two new enums. Nothing existing is
-- altered, so this is safe to apply ahead of the code that uses it. The
-- stakeholder registry starts empty and is seeded separately
-- (scripts/seed-stakeholders.ts), because the names, percentages and bank
-- details are data, not schema.


-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "DistributionShareStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "stakeholders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "baseKobo" INTEGER NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_shares" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "stakeholderId" TEXT NOT NULL,
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "DistributionShareStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentRef" TEXT,

    CONSTRAINT "distribution_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stakeholders_isActive_priority_idx" ON "stakeholders"("isActive", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_periodStart_key" ON "distributions"("periodStart");

-- CreateIndex
CREATE INDEX "distributions_status_idx" ON "distributions"("status");

-- CreateIndex
CREATE INDEX "distribution_shares_status_idx" ON "distribution_shares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_shares_distributionId_stakeholderId_key" ON "distribution_shares"("distributionId", "stakeholderId");

-- AddForeignKey
ALTER TABLE "distribution_shares" ADD CONSTRAINT "distribution_shares_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_shares" ADD CONSTRAINT "distribution_shares_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "stakeholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

