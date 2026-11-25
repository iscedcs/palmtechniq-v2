/**
 * Seeds the stakeholder registry with the figures management finalised on
 * 9 November 2026.
 *
 * Run once:  pnpm tsx scripts/seed-stakeholders.ts
 * Dry run:   pnpm tsx scripts/seed-stakeholders.ts --dry
 *
 * Idempotent. Matches on name, so running it twice updates rather than
 * duplicating, and it refuses outright if the percentages do not total 100.
 *
 * Bank details are deliberately NOT here. They are personal, they do not
 * belong in the repository, and they are filled in per stakeholder afterwards.
 *
 * PRIORITY is the order transfers are queued in, as asked for: the platform's
 * own operating money first, then the parent company, the founder, the CEO,
 * the product lead, the assistant product lead, then the members. It does not
 * affect any amount, because the rates are fixed and sum to 100% of one base.
 */

import { db } from "../lib/db";
import { validateShareTotal } from "../lib/payments/distribution";

const STAKEHOLDERS = [
  { name: "PalmTechnIQ", role: "Company / Product", sharePercent: 20, priority: 1 },
  { name: "ISCE Digital Concept", role: "Parent Company", sharePercent: 40, priority: 2 },
  { name: "Isah Yinusah Inoremhe", role: "Founder", sharePercent: 10, priority: 3 },
  { name: "Oyeniran Ayobami Paul", role: "CEO", sharePercent: 5, priority: 4 },
  { name: "Ignatius Emeka Joshua", role: "Product Lead", sharePercent: 10, priority: 5 },
  { name: "Enebeli Victoria Ashiolise", role: "Assistant Product Lead", sharePercent: 7, priority: 6 },
  { name: "Onyekachukwu Divine Somtochukwu", role: "Member", sharePercent: 2, priority: 7 },
  { name: "Emmanuel Akhabue Oziegbe", role: "Member", sharePercent: 2, priority: 8 },
  { name: "Jeff Aligwekwe", role: "Member", sharePercent: 2, priority: 9 },
  { name: "Micheal Agunbiade", role: "Member", sharePercent: 2, priority: 10 },
];

async function main() {
  const dry = process.argv.includes("--dry");

  const validity = validateShareTotal(
    STAKEHOLDERS.map((s, i) => ({ id: String(i), ...s })),
  );
  if (!validity.ok) {
    console.error(`Refusing to seed: ${validity.message}`);
    process.exit(1);
  }

  console.log(
    `${STAKEHOLDERS.length} stakeholders, totalling 100%${dry ? " (dry run)" : ""}:\n`,
  );
  for (const s of STAKEHOLDERS) {
    console.log(
      `  ${String(s.priority).padStart(2)}. ${s.name.padEnd(34)} ${String(s.sharePercent).padStart(3)}%  ${s.role}`,
    );
  }

  if (dry) {
    console.log("\nNothing written.");
    return;
  }

  let created = 0;
  let updated = 0;

  for (const s of STAKEHOLDERS) {
    const existing = await db.stakeholder.findFirst({
      where: { name: s.name },
      select: { id: true },
    });

    if (existing) {
      // Bank details and notes are left exactly as they are: this script owns
      // the percentages and the order, not the payout information.
      await db.stakeholder.update({
        where: { id: existing.id },
        data: {
          role: s.role,
          sharePercent: s.sharePercent,
          priority: s.priority,
          isActive: true,
        },
      });
      updated += 1;
    } else {
      await db.stakeholder.create({ data: s });
      created += 1;
    }
  }

  const stragglers = await db.stakeholder.findMany({
    where: { isActive: true, name: { notIn: STAKEHOLDERS.map((s) => s.name) } },
    select: { name: true, sharePercent: true },
  });

  console.log(`\nCreated ${created}, updated ${updated}.`);

  if (stragglers.length > 0) {
    // Not retired automatically. Removing someone from the split is a decision
    // for a person to make, and doing it silently here would change what
    // everyone else is paid.
    console.warn(
      `\nWARNING: ${stragglers.length} active stakeholder(s) are not in this list, so the total is no longer 100% and runs will refuse to compute:`,
    );
    for (const s of stragglers) {
      console.warn(`  - ${s.name} (${s.sharePercent}%)`);
    }
    console.warn("Retire them in the admin screen if they should no longer be paid.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    // Guarded: a --dry run never touches the database, and `db` throws on
    // access when DATABASE_URL is unset. Without this, checking the figures
    // without a database configured ended in a stack trace after printing
    // them perfectly well.
    try {
      void db.$disconnect();
    } catch {
      /* nothing was connected */
    }
  });
