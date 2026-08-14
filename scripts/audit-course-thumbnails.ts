/**
 * Find course thumbnails that no longer resolve, and optionally clear them.
 *
 * Uploads moved from AWS S3 to DigitalOcean Spaces, but the stored URLs were
 * never migrated. The old bucket now returns NoSuchBucket, so those rows hold
 * a well-formed URL that 404s.
 *
 * That is worse than an empty column. A missing thumbnail falls back to a
 * placeholder; a dead one is emitted into the OpenGraph image, the Twitter
 * card and the JSON-LD image for the course page, so every share and every
 * search result carries a broken image. Client-side fallbacks cannot help,
 * because metadata is rendered on the server.
 *
 * Clearing the column lets the fallback work and stops the dead URL reaching
 * search engines.
 *
 *   pnpm tsx scripts/audit-course-thumbnails.ts           report only
 *   pnpm tsx scripts/audit-course-thumbnails.ts --apply   clear dead ones
 *
 * Runs against whichever database DATABASE_URL points at, so check that first
 * if you mean to fix production.
 */

import "dotenv/config";

import { writeFileSync } from "fs";

import { db as appDb } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

const db = appDb as PrismaClient;
const apply = process.argv.includes("--apply");

/** HEAD the URL, falling back to a ranged GET for hosts that reject HEAD. */
async function isReachable(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.ok) return true;
    if (head.status !== 405 && head.status !== 501) return false;

    const ranged = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    return ranged.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!apply) console.log("REPORT ONLY. Pass --apply to clear dead thumbnails.\n");

  const courses = await db.course.findMany({
    where: { thumbnail: { not: null } },
    select: { id: true, title: true, status: true, thumbnail: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Checking ${courses.length} course thumbnail(s)…\n`);

  const dead: typeof courses = [];
  let alive = 0;

  for (const course of courses) {
    const ok = await isReachable(course.thumbnail!);
    if (ok) {
      alive += 1;
      continue;
    }
    dead.push(course);
    const label = course.status === "PUBLISHED" ? "PUBLISHED" : course.status;
    console.log(`  dead  [${label}] ${course.title}`);
    console.log(`        ${course.thumbnail}`);
  }

  console.log(`\n${alive} reachable, ${dead.length} dead.`);

  if (dead.length === 0) return;

  const publishedDead = dead.filter((c) => c.status === "PUBLISHED");
  if (publishedDead.length > 0) {
    console.log(
      `\n${publishedDead.length} of them are PUBLISHED, so they are live pages ` +
        "whose share cards and structured data currently point at a missing image.",
    );
  }

  if (!apply) {
    console.log("\nRe-run with --apply to clear these, then ask the tutors to re-upload.");
    return;
  }

  // Save what is about to be removed. The filenames are the only remaining
  // trace of what each course used to show, and they are the thing that makes
  // recovering an original possible if a copy turns up.
  const backupPath = `thumbnail-backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(
    backupPath,
    `${JSON.stringify(
      dead.map((c) => ({ id: c.id, title: c.title, thumbnail: c.thumbnail })),
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`\nSaved the removed URLs to ${backupPath}`);

  const result = await db.course.updateMany({
    where: { id: { in: dead.map((c) => c.id) } },
    data: { thumbnail: null },
  });

  console.log(`Cleared ${result.count} thumbnail(s).`);
  console.log(
    "Those courses now fall back to a generated placeholder, and their " +
      "metadata falls back to the site OpenGraph image.",
  );
}

main()
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
