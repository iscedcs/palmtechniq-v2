-- Paystack identifiers for a stakeholder's payout account.
--
-- `bankName` on its own is a display string. A transfer needs Paystack's bank
-- code, and verifying that an account number really belongs to the named
-- person needs it too, so the code is stored next to the name.
--
-- `recipientCode` is Paystack's transfer recipient, created once an account has
-- been verified. It stays null while transfers are made by hand, which is the
-- case today.
--
-- Additive only: two nullable columns on a table that is itself new in
-- 20261123_stakeholder_distribution. Nothing existing is altered.

ALTER TABLE "stakeholders" ADD COLUMN IF NOT EXISTS "bankCode" TEXT;
ALTER TABLE "stakeholders" ADD COLUMN IF NOT EXISTS "recipientCode" TEXT;
