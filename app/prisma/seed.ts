import "dotenv/config";

import { db as appDb } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";
import { PROGRAMS } from "@/data/programs";

// Reuse the app's client rather than `new PrismaClient()` — Prisma 7 requires a
// driver adapter, and lib/db already wires up the Neon one.
const prisma = appDb as PrismaClient;

async function main() {
  console.log(`Starting seed: upserting ${PROGRAMS.length} professional programs...`);

  let upsertedCount = 0;
  for (const p of PROGRAMS) {
    await prisma.professionalProgram.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        duration: p.duration,
        fullPrice: p.fullPrice,
        installTotal: p.installTotal,
        firstInstall: p.firstInstall,
        secondInstall: p.secondInstall,
        careerOutcomes: p.careerOutcomes,
        curriculum: p.curriculum,
        isActive: true,
      },
      create: {
        slug: p.slug,
        name: p.name,
        duration: p.duration,
        fullPrice: p.fullPrice,
        installTotal: p.installTotal,
        firstInstall: p.firstInstall,
        secondInstall: p.secondInstall,
        careerOutcomes: p.careerOutcomes,
        curriculum: p.curriculum,
        isActive: true,
      },
    });
    upsertedCount++;
  }

  console.log(`✅ Successfully seeded ${upsertedCount} professional programs to active DB.`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

