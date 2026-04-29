-- CreateEnum
CREATE TYPE "GroupPurchaseStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('CREATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "groupPurchaseId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "groupPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "group_tiers" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "groupPrice" DOUBLE PRECISION NOT NULL,
    "cashbackPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_purchases" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "GroupPurchaseStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "memberLimit" INTEGER NOT NULL,
    "groupPrice" DOUBLE PRECISION NOT NULL,
    "cashbackTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackPerMember" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackReleased" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupPurchaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_purchases_inviteCode_key" ON "group_purchases"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupPurchaseId_userId_key" ON "group_members"("groupPurchaseId", "userId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_groupPurchaseId_fkey" FOREIGN KEY ("groupPurchaseId") REFERENCES "group_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_groupPurchaseId_fkey" FOREIGN KEY ("groupPurchaseId") REFERENCES "group_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tiers" ADD CONSTRAINT "group_tiers_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchases" ADD CONSTRAINT "group_purchases_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchases" ADD CONSTRAINT "group_purchases_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "group_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_purchases" ADD CONSTRAINT "group_purchases_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupPurchaseId_fkey" FOREIGN KEY ("groupPurchaseId") REFERENCES "group_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
