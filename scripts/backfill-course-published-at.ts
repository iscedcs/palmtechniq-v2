/**
 * One-time backfill: give live courses a publish date.
 *
 *   npx tsx scripts/backfill-course-published-at.ts            # dry run (default)
 *   npx tsx scripts/backfill-course-published-at.ts --apply    # write it
 *
 * WHY
 *
 * The admin Courses page and dashboard publish through updateCourseStatus,
 * which never set `publishedAt`. So every course approved that way has a null
 * publish date: it is missing `datePublished` from its structured data, which
 * Google reads to judge how established a page is. The fix in
 * updateCourseStatus covers courses approved from now on; this covers the ones
 * already live.
 *
 * WHAT VALUE
 *
 * `createdAt`. The true publish date was not recorded, so any value is an
 * estimate; a course cannot have been published before it was created, so this
 * is a floor and can only be too early, never impossible. It is also
 * deterministic, so a re-run changes nothing.
 *
 * Only PUBLISHED courses with a null publishedAt are touched. Nothing else is
 * read or written, and the default is a dry run.
 */
import "dotenv/config";

import { db } from "@/lib/db";

async function main() {
  const apply = process.argv.includes("--apply");

  const dbName = ((await db.$queryRawUnsafe("select current_database()::text as name")) as any[])[0].name as string;
  console.log(`Database: ${dbName}`);
  console.log(apply ? "Mode: APPLY (will write)" : "Mode: dry run (nothing will be written)");

  const courses = await db.course.findMany({
    where: { status: "PUBLISHED", publishedAt: null },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n${courses.length} live course(s) have no publish date:\n`);
  for (const c of courses) {
    console.log(`  ${c.createdAt.toISOString().slice(0, 10)}  ${c.title}`);
  }

  if (courses.length === 0 || !apply) {
    if (courses.length > 0) console.log("\nRe-run with --apply to set each to its creation date.");
    return;
  }

  let updated = 0;
  for (const c of courses) {
    // Conditional on still being null, so a course published for real between
    // the read above and this write keeps its true date.
    const res = await db.course.updateMany({
      where: { id: c.id, publishedAt: null },
      data: { publishedAt: c.createdAt },
    });
    updated += res.count;
  }
  console.log(`\nUpdated ${updated} course(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
