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
 *   Wallets            Tutor and mentor wallet balances. Course and mentorship
 *                      earnings are credited here at settlement, so they are
 *                      already counted. Student cashback credit is NOT owed as
 *                      cash (it is spendable store credit), so it is excluded.
 *   Open withdrawals   Requests awaiting approval. They were already debited
 *                      from the wallet when requested, so they are owed on top
 *                      of the wallets. APPROVED ones are not counted: the
 *                      transfer has been started and Paystack has already
 *                      taken that money out of the balance.
 *   Program accruals   Program earnings accrued but not yet released. They
 *                      reach a wallet only on release, but the cash behind
 *                      them is already in the balance.
 *   VAT to remit       VAT collected and not yet remitted.
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
  accruedProgramEarnings: number;
  vatToRemit: number;
};

export type MoneyPosition = {
  paystackBalance: number | null;
  owed: {
    tutorAndMentorWallets: number;
    openWithdrawals: number;
    accruedProgramEarnings: number;
    vatToRemit: number;
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
    toKobo(input.accruedProgramEarnings) +
    toKobo(input.vatToRemit);

  const available =
    input.paystackBalance === null
      ? null
      : fromKobo(toKobo(input.paystackBalance) - owedKobo);

  return {
    paystackBalance: input.paystackBalance,
    owed: {
      tutorAndMentorWallets: input.tutorAndMentorWallets,
      openWithdrawals: input.openWithdrawals,
      accruedProgramEarnings: input.accruedProgramEarnings,
      vatToRemit: input.vatToRemit,
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
