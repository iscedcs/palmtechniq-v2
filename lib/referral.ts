import { db } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * Generate a unique 8-character alphanumeric referral code for a tutor.
 */
export function generateReferralCode(): string {
  return randomBytes(4).toString("hex"); // 8 hex chars
}

/**
 * Ensure a tutor has a referral code. If they don't, generate one and save it.
 * Returns the referral code.
 */
export async function ensureTutorReferralCode(
  tutorId: string,
): Promise<string> {
  const tutor = await db.tutor.findUnique({
    where: { id: tutorId },
    select: { referralCode: true },
  });

  if (tutor?.referralCode) return tutor.referralCode;

  // Generate unique code with retry
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    try {
      await db.tutor.update({
        where: { id: tutorId },
        data: { referralCode: code },
      });
      return code;
    } catch {
      // Unique constraint violation, retry
      continue;
    }
  }

  throw new Error("Failed to generate unique referral code");
}

/**
 * Resolve a referral code to a tutor's userId.
 * Returns the tutor userId or null if not found.
 */
export async function resolveTutorReferralCode(
  referralCode: string,
): Promise<string | null> {
  const tutor = await db.tutor.findFirst({
    where: { referralCode },
    select: { userId: true },
  });
  return tutor?.userId ?? null;
}

/**
 * Get a tutor's referral code by their userId. Generates one if missing.
 */
export async function getTutorReferralCode(
  userId: string,
): Promise<string | null> {
  const tutor = await db.tutor.findFirst({
    where: { userId },
    select: { id: true, referralCode: true },
  });

  if (!tutor) return null;
  if (tutor.referralCode) return tutor.referralCode;

  return ensureTutorReferralCode(tutor.id);
}

/** Cookie name for tutor referral tracking */
export const REFERRAL_COOKIE_NAME = "tutor_ref";

/** Cookie max age: 30 days */
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
