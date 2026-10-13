/**
 * Paystack TEST-mode payments move no real money, but they used to settle like
 * any other payment: enrol the buyer, credit the tutor's wallet and count as
 * revenue. One such payment in April put N150,000 of test money into a tutor's
 * withdrawable balance on the live database.
 *
 * paystackVerify rejects them, so every payment path treats a test-mode
 * payment as failed and credits nothing.
 *
 * ALLOW_TEST_PAYMENTS=true switches that off. It exists so checkout can still
 * be exercised locally against a throwaway database with Paystack test keys.
 * Never set it where the database holds real data: production must leave it
 * unset, and so must any local setup pointed at the live database.
 */
export const testPaymentsAllowed = () =>
  process.env.ALLOW_TEST_PAYMENTS === "true";
