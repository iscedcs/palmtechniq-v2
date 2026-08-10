/**
 * Wallet reconciliation.
 *
 * Every wallet movement now writes a WalletEntry in the same transaction as
 * the balance change, so from here on the invariant holds:
 *
 *   walletBalance === sum(WalletEntry.amount)
 *
 * Balances that existed BEFORE the ledger cannot be reconstructed honestly —
 * group cashback in particular moved money while recording nothing, which is
 * where the known drift came from. Rather than invent history, --apply writes
 * one ADJUSTMENT entry per user for their current balance, labelled as an
 * opening balance. That makes the invariant true from today onward without
 * pretending to explain what came before.
 *
 * Run with:
 *   pnpm tsx scripts/reconcile-wallets.ts           (report only)
 *   pnpm tsx scripts/reconcile-wallets.ts --apply   (write opening balances)
 */

import "dotenv/config";

import { db as appDb } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

const db = appDb as PrismaClient;
const apply = process.argv.includes("--apply");

async function main() {
  if (!apply) console.log("REPORT ONLY — pass --apply to write.\n");

  const [users, entries] = await Promise.all([
    db.user.findMany({
      where: { OR: [{ walletBalance: { not: 0 } }, { walletEntries: { some: {} } }] },
      select: { id: true, name: true, walletBalance: true },
      orderBy: { name: "asc" },
    }),
    db.walletEntry.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const ledgerByUser = new Map<string, number>(
    entries.map((row: any) => [row.userId, row._sum.amount ?? 0]),
  );

  let drifting = 0;
  let written = 0;

  for (const user of users) {
    const ledger = ledgerByUser.get(user.id) ?? 0;
    const gap = Number((user.walletBalance - ledger).toFixed(2));

    if (gap === 0) {
      console.log(`  ✅ ${user.name}: ₦${user.walletBalance.toLocaleString()} reconciled`);
      continue;
    }

    drifting += 1;
    console.log(
      `  ⚠️  ${user.name}: wallet ₦${user.walletBalance.toLocaleString()} | ledger ₦${ledger.toLocaleString()} | unexplained ₦${gap.toLocaleString()}`,
    );

    if (apply) {
      await db.walletEntry.create({
        data: {
          userId: user.id,
          amount: gap,
          type: "ADJUSTMENT",
          balanceAfter: user.walletBalance,
          description:
            "Opening balance — movements predating the wallet ledger",
        },
      });
      written += 1;
    }
  }

  console.log(
    `\n${users.length} wallet(s) checked, ${drifting} unexplained.${
      apply ? ` Wrote ${written} opening balance entr${written === 1 ? "y" : "ies"}.` : ""
    }`,
  );

  if (!apply && drifting > 0) {
    console.log(
      "Re-run with --apply to record these as opening balances so the ledger reconciles from today.",
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
