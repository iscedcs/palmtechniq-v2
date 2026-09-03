"use server";

import { db } from "@/lib/db";

/**
 * One-time backfill script to generate usernames for all existing users.
 * Converts "John Doe" → "johndoe", handles duplicates by appending numbers.
 * Run via: npx tsx scripts/backfill-usernames.ts
 * Or call from an admin action.
 */
export async function backfillUsernames() {
  const users = await db.user.findMany({
    where: { username: null },
    select: { id: true, name: true, email: true },
  });

  console.log(`[backfill] Found ${users.length} users without usernames`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    // Generate base username from name, fallback to email prefix
    const baseName = user.name?.trim() || user.email.split("@")[0];
    const baseUsername = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")  // strip non-alphanumeric
      .slice(0, 30);               // cap length

    if (!baseUsername) {
      console.log(`[backfill] Skipping user ${user.id} — no usable name`);
      skipped++;
      continue;
    }

    // Find a unique username, appending numbers if needed
    let candidate = baseUsername;
    let suffix = 1;

    while (true) {
      const existing = await db.user.findUnique({
        where: { username: candidate },
        select: { id: true },
      });

      if (!existing || existing.id === user.id) break;

      candidate = `${baseUsername}${suffix}`;
      suffix++;

      if (suffix > 100) {
        // Safety valve — use ID fragment
        candidate = `${baseUsername}${user.id.slice(-4)}`;
        break;
      }
    }

    try {
      await db.user.update({
        where: { id: user.id },
        data: { username: candidate },
      });
      updated++;
    } catch (err) {
      console.error(`[backfill] Failed for user ${user.id}:`, err);
      skipped++;
    }
  }

  console.log(`[backfill] Done. Updated: ${updated}, Skipped: ${skipped}`);
  return { updated, skipped, total: users.length };
}

// Allow running directly: npx tsx scripts/backfill-usernames.ts
if (require.main === module) {
  backfillUsernames()
    .then((result) => {
      console.log("Result:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed:", err);
      process.exit(1);
    });
}
