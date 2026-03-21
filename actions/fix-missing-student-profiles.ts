/**
 * Fix students enrolled by admin who are missing Student profiles.
 *
 * Can be called from admin panel or via server action.
 */
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function FixMissingStudentProfiles() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  // Find all users who have enrollments but no Student profile
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

  if (enrolledUsersWithoutProfile.length === 0) {
    return { success: true, message: "Nothing to fix.", fixedCount: 0 };
  }

  for (const user of enrolledUsersWithoutProfile) {
    // Create Student profile
    await db.student.create({
      data: {
        userId: user.id,
        interests: [],
        goals: [],
      },
    });

    // Update role to STUDENT if not already STUDENT or ADMIN
    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "STUDENT" },
      });
    }
  }

  return {
    success: true,
    message: `Fixed ${enrolledUsersWithoutProfile.length} user(s).`,
    fixedCount: enrolledUsersWithoutProfile.length,
  };
}
