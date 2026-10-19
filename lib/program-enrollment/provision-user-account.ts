import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generatePasswordResetToken } from "@/lib/token";
import { SITE_URL } from "@/lib/site";
import { randomBytes } from "crypto";

/**
 * Provision a user account after a successful program enrollment payment.
 * - If the user already exists, links the enrollment to that user.
 * - If not, creates an account with temporary credentials and a password
 *   reset link so they can set their own password.
 *
 * Shared by the public enroll-form verify flow and the admin payment-link
 * verify flow — one implementation so both behave identically.
 *
 * Returns { isNew, userId, tempPassword?, resetLink? }
 */
export async function provisionUserAccount(enrollment: {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
}) {
  const existingUser = await db.user.findUnique({
    where: { email: enrollment.email },
  });

  if (existingUser) {
    await db.programEnrollment.update({
      where: { id: enrollment.id },
      data: { userId: existingUser.id },
    });
    return { isNew: false, userId: existingUser.id };
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const newUser = await db.user.create({
    data: {
      email: enrollment.email,
      name: enrollment.fullName,
      phone: enrollment.phone ?? undefined,
      password: hashedPassword,
      role: "USER",
      emailVerified: new Date(), // Auto-verified since they paid
      isVerified: true,
    },
  });

  await db.student.create({
    data: { userId: newUser.id },
  });

  await db.programEnrollment.update({
    where: { id: enrollment.id },
    data: { userId: newUser.id },
  });

  const resetToken = await generatePasswordResetToken(enrollment.email);

  return {
    isNew: true,
    userId: newUser.id,
    tempPassword,
    resetLink: `${SITE_URL}/new-password?token=${resetToken.token}`,
  };
}

function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}
