/**
 * One-time script to fix students enrolled by admin who are missing Student profiles.
 *
 * Run with: npx tsx scripts/fix-missing-student-profiles.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Make sure .env is configured.");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const db = new PrismaClient({ adapter });

async function fixMissingStudentProfiles() {
  const enrolledUsersWithoutProfile = await db.user.findMany({
    where: {
      enrollments: { some: {} },
      studentProfile: { is: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(
    `Found ${enrolledUsersWithoutProfile.length} enrolled user(s) without a Student profile.`,
  );

  if (enrolledUsersWithoutProfile.length === 0) {
    console.log("Nothing to fix.");
    return;
  }

  for (const user of enrolledUsersWithoutProfile) {
    console.log(
      `Fixing: ${user.name} (${user.email}) - current role: ${user.role}`,
    );

    await db.student.create({
      data: {
        userId: user.id,
        interests: [],
        goals: [],
      },
    });

    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "STUDENT" },
      });
      console.log(`  -> Role updated to STUDENT`);
    }

    console.log(`  -> Student profile created`);
  }

  console.log(`\nDone! Fixed ${enrolledUsersWithoutProfile.length} user(s).`);
}

fixMissingStudentProfiles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
