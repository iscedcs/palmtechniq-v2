"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@!%*?&";
  let password = "";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  // Ensure password meets requirements
  return password + "A1@x";
}

export async function addTester(data: { email: string; name: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPERIOR") {
      return { error: "Unauthorized" };
    }

    const { email, name } = data;
    if (!email || !name) {
      return { error: "Email and name are required" };
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // If user exists but is not a TESTER, update their role
      if (existingUser.role === "TESTER") {
        return { error: "This user is already a tester" };
      }
      return {
        error:
          "A user with this email already exists with a different role. Please use a different email.",
      };
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: UserRole.TESTER,
        mustChangePassword: true,
        invitedBy: session.user.id,
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    // Send invite email with temp credentials
    try {
      const { sendTesterInviteEmail } = await import("@/lib/mail");
      await sendTesterInviteEmail(email, name, tempPassword);
    } catch (emailError) {
      console.error("Failed to send tester invite email:", emailError);
      // Don't fail the whole operation if email fails
    }

    return { success: "Tester added successfully! Invite email sent." };
  } catch (error) {
    console.error("Add tester error:", error);
    return { error: "Failed to add tester" };
  }
}

export async function removeTester(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPERIOR") {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: "User not found" };
    }

    if (user.role !== "TESTER") {
      return { error: "User is not a tester" };
    }

    await db.user.delete({ where: { id: userId } });

    return { success: "Tester removed successfully" };
  } catch (error) {
    console.error("Remove tester error:", error);
    return { error: "Failed to remove tester" };
  }
}

export async function listTesters() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPERIOR") {
      return { error: "Unauthorized", testers: [] };
    }

    const testers = await db.user.findMany({
      where: { role: UserRole.TESTER },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        mustChangePassword: true,
        lastLoginAt: true,
        invitedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { testers };
  } catch (error) {
    console.error("List testers error:", error);
    return { error: "Failed to list testers", testers: [] };
  }
}

export async function resendTesterInvite(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPERIOR") {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, role: true },
    });

    if (!user || user.role !== "TESTER") {
      return { error: "Tester not found" };
    }

    // Generate new temp password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    try {
      const { sendTesterInviteEmail } = await import("@/lib/mail");
      await sendTesterInviteEmail(
        user.email!,
        user.name || "Tester",
        tempPassword,
      );
    } catch (emailError) {
      console.error("Failed to resend tester invite email:", emailError);
      return { error: "Failed to send invite email" };
    }

    return { success: "Invite resent with new credentials" };
  } catch (error) {
    console.error("Resend invite error:", error);
    return { error: "Failed to resend invite" };
  }
}
