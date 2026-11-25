-- A refunded mentorship payment had nowhere to be recorded.
--
-- MentorshipPaymentStatus held PENDING, PAID and FAILED only, so a session
-- whose money had been returned still read PAID. The refund path now marks the
-- payment REFUNDED and cancels the booking with it, unless the session had
-- already been delivered and was refunded as an override, in which case the
-- record of teaching stands and only the payment status changes.
--
-- Additive: a new enum value. Existing rows are untouched.

ALTER TYPE "MentorshipPaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
