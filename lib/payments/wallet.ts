/**
 * Wallet movements.
 *
 * Every change to User.walletBalance must go through creditWallet or
 * debitWallet so that a WalletEntry is written in the SAME transaction as the
 * balance change. Updating walletBalance directly is how group cashback ended
 * up moving money on both sides with no record, leaving balances that could
 * not be reconciled against anything.
 *
 * Invariant these helpers maintain:
 *   walletBalance === sum(WalletEntry.amount)
 */

export type WalletEntryType =
  | "COURSE_EARNING"
  | "MENTORSHIP_EARNING"
  | "PROGRAM_EARNING_RELEASE"
  | "GROUP_CASHBACK_CREDIT"
  | "GROUP_CASHBACK_DEBIT"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_REVERSED"
  | "COURSE_CREDIT_APPLIED"
  | "ADJUSTMENT";

type Refs = {
  transactionId?: string | null;
  tutorEarningId?: string | null;
  withdrawalRequestId?: string | null;
  groupPurchaseId?: string | null;
  description?: string | null;
};

/**
 * Move money into a wallet and record why.
 *
 * `tx` must be a Prisma transaction client — the balance change and its ledger
 * entry have to commit or fail together, otherwise the ledger can drift from
 * the balance it is supposed to explain.
 */
export async function creditWallet(
  tx: any,
  {
    userId,
    amount,
    type,
    ...refs
  }: { userId: string; amount: number; type: WalletEntryType } & Refs,
) {
  if (amount <= 0) return null;

  const user = await tx.user.update({
    where: { id: userId },
    data: { walletBalance: { increment: amount } },
    select: { walletBalance: true },
  });

  return tx.walletEntry.create({
    data: {
      userId,
      amount,
      type,
      balanceAfter: user.walletBalance,
      transactionId: refs.transactionId ?? null,
      tutorEarningId: refs.tutorEarningId ?? null,
      withdrawalRequestId: refs.withdrawalRequestId ?? null,
      groupPurchaseId: refs.groupPurchaseId ?? null,
      description: refs.description ?? null,
    },
  });
}

/**
 * Move money out of a wallet and record why.
 *
 * Records the amount as negative, so reconciliation is a plain sum rather than
 * a sum that has to know which types are debits.
 */
export async function debitWallet(
  tx: any,
  {
    userId,
    amount,
    type,
    ...refs
  }: { userId: string; amount: number; type: WalletEntryType } & Refs,
) {
  if (amount <= 0) return null;

  const user = await tx.user.update({
    where: { id: userId },
    data: { walletBalance: { decrement: amount } },
    select: { walletBalance: true },
  });

  return tx.walletEntry.create({
    data: {
      userId,
      amount: -amount,
      type,
      balanceAfter: user.walletBalance,
      transactionId: refs.transactionId ?? null,
      tutorEarningId: refs.tutorEarningId ?? null,
      withdrawalRequestId: refs.withdrawalRequestId ?? null,
      groupPurchaseId: refs.groupPurchaseId ?? null,
      description: refs.description ?? null,
    },
  });
}
