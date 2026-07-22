/**
 * Backfill script: Sync flash-sale fields for all courses that are currently
 * under an active CoursePromotion with a promoPrice set.
 *
 * Run with:
 *   pnpm tsx scripts/backfill-promo-flash-sale.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const now = new Date();

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

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
