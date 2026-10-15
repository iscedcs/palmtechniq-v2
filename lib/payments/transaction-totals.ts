import "server-only";

import { db } from "@/lib/db";
import {
  summariseTransactions,
  type SummarisableTransaction,
  type TransactionSummary,
} from "@/lib/payments/transaction-origin";

type Row = SummarisableTransaction & { paymentDate: Date };

/**
 * Totals for every money screen, split by origin so legacy and test rows can
 * never be added into live revenue.
 *
 * Reads a lean row per transaction and classifies in code rather than in SQL:
 * filtering on JSON inside Postgres treats a NULL metadata as "no match" even
 * under NOT, which would silently drop live rows. The cost is that metadata is
 * loaded, which is fine for an admin screen at this table size; if the table
 * grows into the tens of thousands, persist an `origin` column instead and
 * aggregate in the database.
 *
 * `thisMonth` is by payment date, matching how the dashboard has always cut it.
 */
export async function getTransactionSummaries(monthStart?: Date): Promise<{
  allTime: TransactionSummary;
  thisMonth: TransactionSummary;
}> {
  const rows = (await db.transaction.findMany({
    select: {
      transactionId: true,
      status: true,
      amount: true,
      vatAmount: true,
      tutorShareAmount: true,
      platformShareAmount: true,
      paymentDate: true,
      metadata: true,
    },
  })) as Row[];

  const inMonth = monthStart
    ? rows.filter((r) => r.paymentDate >= monthStart)
    : [];

  return {
    allTime: summariseTransactions(rows),
    thisMonth: summariseTransactions(inMonth),
  };
}
