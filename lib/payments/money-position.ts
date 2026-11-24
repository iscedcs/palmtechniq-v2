/**
 * How much of the Paystack balance is the platform's own.
 *
 * With Manual Payouts, collections stay in the Paystack balance instead of
 * being swept to the bank each day. That balance is not all the platform's:
 * it also holds money owed to tutors and mentors, and VAT that has to be
 * remitted. This works out what is left, so a withdrawal to the bank cannot
 * accidentally spend tutors' money.
 *
 * What is owed, and what deliberately is not:
 *
 *   Wallets            Tutor and mentor wallet balances: earnings that have
 *                      been released. Student cashback credit is NOT owed as
 *                      cash (it is spendable store credit), so it is excluded.
 *   Open withdrawals   Requests awaiting approval. They were already debited
 *                      from the wallet when requested, so they are owed on top
 *                      of the wallets. APPROVED ones are not counted: the
 *                      transfer has been started and Paystack has already
 *                      taken that money out of the balance.
 *   Held earnings      Every earning accrued and not yet released, whatever
 *                      its source. Course and mentorship earnings are held for
 *                      the refund window, and program earnings until the later
 *                      of that and the cohort start. None of them has reached
 *                      a wallet, but the cash behind all of them is already in
 *                      the balance, and it is owed. Counting only the program
 *                      ones overstated what the platform could safely move to
 *                      its own bank by the whole held course balance.
 *   VAT to remit       VAT collected and not yet remitted.
 *   Approved payouts   Stakeholder distributions approved but not yet paid.
 *                      Once a run is signed off the money is committed to
 *                      named people. Leaving it out would let the same naira
 *                      be distributed twice: the next run would compute its
 *                      base from revenue, see the cash still sitting in the
 *                      balance, and hand it out again.
 *
 * It is an estimate. It does not model Paystack's own fees or money that has
 * been charged but not yet settled into the balance.
 *
 * PURE, like revenue.ts: no `db`, no I/O. Sums are done in kobo.
 */

export type MoneyPositionInput = {
  /** Naira. null when Paystack could not be reached. */
  paystackBalance: number | null;
  tutorAndMentorWallets: number;
  openWithdrawals: number;
  heldEarnings: number;
  vatToRemit: number;
  approvedDistributions: number;
};

export type MoneyPosition = {
  paystackBalance: number | null;
  owed: {
    tutorAndMentorWallets: number;
    openWithdrawals: number;
    heldEarnings: number;
    vatToRemit: number;
    approvedDistributions: number;
  };
  totalOwed: number;
  /** Balance minus everything owed. null when the balance is unknown. */
  available: number | null;
  /** True when what is owed is more than the balance holds. */
  shortfall: boolean;
};

const toKobo = (naira: number) => Math.round(naira * 100);
const fromKobo = (kobo: number) => kobo / 100;

export function computeMoneyPosition(input: MoneyPositionInput): MoneyPosition {
  const owedKobo =
    toKobo(input.tutorAndMentorWallets) +
    toKobo(input.openWithdrawals) +
    toKobo(input.heldEarnings) +
    toKobo(input.vatToRemit) +
    toKobo(input.approvedDistributions);

  const available =
    input.paystackBalance === null
      ? null
      : fromKobo(toKobo(input.paystackBalance) - owedKobo);

  return {
    paystackBalance: input.paystackBalance,
    owed: {
      tutorAndMentorWallets: input.tutorAndMentorWallets,
      openWithdrawals: input.openWithdrawals,
      heldEarnings: input.heldEarnings,
      vatToRemit: input.vatToRemit,
      approvedDistributions: input.approvedDistributions,
    },
    totalOwed: fromKobo(owedKobo),
    available,
    shortfall: available !== null && available < 0,
  };
}

/** Whether the Paystack balance can fund a payout of `amount` naira. */
export function canCoverPayout(balance: number, amount: number): boolean {
  return toKobo(balance) >= toKobo(amount);
}

/**
 * What a tutor may actually withdraw: their wallet balance minus money that is
 * already promised to someone else.
 *
 * Group cashback is the case this exists for. The tutor funds it, but it is
 * only paid to the group creator once the refund window on the group's sales
 * closes, so for up to 30 days the money sits in the tutor's wallet while
 * being owed to a student. Without this reserve the tutor could withdraw it
 * first and the cashback would be permanently unfundable: the student would be
 * owed a discount nobody could pay.
 */
export function computeWithdrawableBalance(
  walletBalance: number,
  reservedForCashback: number,
): number {
  return Math.max(
    0,
    fromKobo(toKobo(walletBalance) - toKobo(Math.max(0, reservedForCashback))),
  );
}
