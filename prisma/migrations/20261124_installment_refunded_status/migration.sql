-- A refunded installment needs its own state.
--
-- CANCELLED already meant "never paid and no longer expected". Reusing it for
-- a payment that WAS collected and then returned would confuse cash that
-- arrived and went back with cash that never arrived, and the distribution
-- base counts installments by status: leaving a refunded one as PAID would go
-- on treating it as revenue to share out.
--
-- Adding a value only, so this is safe to apply ahead of the code.

-- AlterEnum
ALTER TYPE "InstallmentStatus" ADD VALUE 'REFUNDED';

