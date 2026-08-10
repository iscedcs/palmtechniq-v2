/**
 * Backfill script: Sync flash-sale fields for all courses that are currently
 * under an active CoursePromotion with a promoPrice set.
 *
 * Run with:
 *   pnpm tsx scripts/backfill-promo-flash-sale.ts
 *
 * Pass --dry-run to print what would change without writing to any course.
 */

// Must come first: lib/db reads DATABASE_URL at module load, so the env has to
// be populated before that import is evaluated.
import "dotenv/config";

import { db as appDb } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

// Reuse the app's client rather than `new PrismaClient()` — Prisma 7 requires a
// driver adapter, and lib/db already wires up the Neon one.
const db = appDb as PrismaClient;

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const now = new Date();

  if (dryRun) console.log("Dry run — no courses will be written.\n");

  // Find all currently active promotions that have a promoPrice
  const activePromos = await db.coursePromotion.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
      promoPrice: { not: null },
    },
    select: {
      id: true,
      courseId: true,
      promoPrice: true,
      endDate: true,
      course: {
        select: {
          id: true,
          title: true,
          isFlashSale: true,
          currentPrice: true,
          flashSaleEnd: true,
        },
      },
    },
  });

  console.log(`Found ${activePromos.length} active promotions with a promo price.\n`);

  for (const promo of activePromos) {
    const { courseId, promoPrice, endDate, course } = promo;

    console.log(
      `[${course.title}] — current: isFlashSale=${course.isFlashSale}, currentPrice=${course.currentPrice}`,
    );
    console.log(
      `  → Setting isFlashSale=true, currentPrice=${promoPrice}, flashSaleEnd=${endDate.toISOString()}`,
    );

    if (dryRun) {
      console.log(`  ⏭️  Skipped (dry run)\n`);
      continue;
    }

    await db.course.update({
      where: { id: courseId },
      data: {
        isFlashSale: true,
        flashSaleEnd: endDate,
        currentPrice: promoPrice,
      },
    });

    console.log(`  ✅ Done\n`);
  }

  console.log(dryRun ? "Dry run complete." : "Backfill complete.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
