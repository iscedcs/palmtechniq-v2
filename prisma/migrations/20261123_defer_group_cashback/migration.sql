-- Group cashback is no longer paid when the group fills.
--
-- The tutor funds it out of their share of the group's own sales, and that
-- share is now held until the 30-day refund window closes. Paying the creator
-- at completion asked the tutor for money they did not have yet: the debit
-- found an empty wallet and refused, which failed the join and left a full
-- group stuck. The obligation is dated instead and settled by the release
-- sweep, on the same timetable as the earnings that fund it.
--
-- Nullable, so existing rows need no backfill. Groups that completed under the
-- old behaviour already have cashbackReleased = true and are skipped by the
-- sweep, which only looks at unreleased cashback with a date that has passed.
ALTER TABLE "group_purchases" ADD COLUMN     "cashbackAvailableAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "group_purchases_cashbackReleased_cashbackAvailableAt_idx" ON "group_purchases"("cashbackReleased", "cashbackAvailableAt");
