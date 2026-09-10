"use server";

import crypto from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateTotpQrCode, generateTotpSecret, verifyTotpToken } from "@/lib/totp";
import { sendTwoFactorOtpEmail } from "@/lib/mail";
import { defaultUserPreferences, type UserPreferences } from "@/lib/user-preferences";

export type TwoFactorMethod = "AUTHENTICATOR" | "EMAIL";

export interface AccountSecurityStatus {
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: TwoFactorMethod | null;
  email: string;
}

export type SecurityActionResult<T = void> =
  | { success: true; error?: undefined; message?: string; data?: T }
  | { success: false; error: string; message?: undefined; data?: undefined };

/**
 * Retrieves the current security configuration status for the signed-in user.
 */
export async function getAccountSecurityStatus(): Promise<
  SecurityActionResult<AccountSecurityStatus>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      password: true,
      preferences: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const prefs = (user.preferences as Record<string, unknown>) || {};
  const twoFactorEnabled = Boolean(prefs.twoFactorEnabled);
  const twoFactorMethod =
    (prefs.twoFactorMethod as TwoFactorMethod) || (twoFactorEnabled ? "AUTHENTICATOR" : null);

  return {
    success: true,
    data: {
      hasPassword: Boolean(user.password && user.password.length > 0),
      twoFactorEnabled,
      twoFactorMethod,
      email: user.email,
    },
  };
}

/**
 * Updates or sets the account password.
 */
export async function updateAccountPassword(params: {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<SecurityActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { currentPassword, newPassword, confirmNewPassword } = params;

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  if (newPassword !== confirmNewPassword) {
    return { success: false, error: "New passwords do not match." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  // If user already has a password set, verify currentPassword
  if (user.password) {
    if (!currentPassword) {
      return { success: false, error: "Current password is required." };
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Incorrect current password." };
    }
  }

  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id: session.user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  return { success: true, message: "Password updated successfully." };
}

/**
 * Generates TOTP secret and QR code for Authenticator App setup.
 */
export async function generateAuthenticatorSetup(): Promise<
  SecurityActionResult<{ secret: string; qrCodeDataUrl: string; otpauthUrl: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const secret = generateTotpSecret();
  const { qrCodeDataUrl, otpauthUrl } = await generateTotpQrCode({
    secret,
    email: user.email,
    issuer: "PalmTechnIQ",
  });

  return {
    success: true,
    data: {
      secret,
      qrCodeDataUrl,
      otpauthUrl,
    },
  };
}

/**
 * Verifies code against provided TOTP secret and enables Authenticator 2FA.
 */
export async function verifyAndEnableAuthenticator(params: {
  secret: string;
  code: string;
}): Promise<SecurityActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { secret, code } = params;
  if (!secret || !code || code.trim().length !== 6) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  const isValid = verifyTotpToken(secret, code);
  if (!isValid) {
    return {
      success: false,
      error: "Invalid verification code. Please check your authenticator app and try again.",
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const existingPrefs = (user?.preferences as Record<string, unknown>) || {};
  const updatedPrefs = {
    ...existingPrefs,
    twoFactorEnabled: true,
    twoFactorMethod: "AUTHENTICATOR",
    twoFactorSecret: secret,
    twoFactorActivatedAt: new Date().toISOString(),
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: updatedPrefs },
  });

  return {
    success: true,
    message: "Authenticator app enabled successfully as your two-factor method.",
  };
}

/**
 * Sends a 6-digit one-time code to the user's email for 2FA setup.
 */
export async function sendEmailTwoFactorOtp(): Promise<SecurityActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, preferences: true },
  });

  if (!user || !user.email) {
    return { success: false, error: "User email not found." };
  }

  // Generate 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Hash the OTP before storing in preferences for defense-in-depth
  const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

  const existingPrefs = (user.preferences as Record<string, unknown>) || {};
  const updatedPrefs = {
    ...existingPrefs,
    pendingEmailOtpHash: otpHash,
    pendingEmailOtpExpiresAt: expiresAt,
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: updatedPrefs },
  });

  const mailResult = await sendTwoFactorOtpEmail({
    email: user.email,
    name: user.name || undefined,
    code: otpCode,
    expiresInMinutes: 10,
  });

  if (mailResult && "error" in mailResult && mailResult.error) {
    return { success: false, error: mailResult.error };
  }

  return {
    success: true,
    message: `A 6-digit verification code has been sent to ${user.email}.`,
  };
}

/**
 * Verifies the email OTP and enables Email-based 2FA.
 */
export async function verifyAndEnableEmailTwoFactor(params: {
  code: string;
}): Promise<SecurityActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { code } = params;
  if (!code || code.trim().length !== 6) {
    return { success: false, error: "Please enter the 6-digit verification code sent to your email." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const existingPrefs = (user?.preferences as Record<string, unknown>) || {};
  const expectedHash = existingPrefs.pendingEmailOtpHash as string | undefined;
  const expiresAtStr = existingPrefs.pendingEmailOtpExpiresAt as string | undefined;

  if (!expectedHash || !expiresAtStr) {
    return {
      success: false,
      error: "No verification code was requested or code has expired. Please request a new code.",
    };
  }

  if (new Date(expiresAtStr).getTime() < Date.now()) {
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  const inputHash = crypto.createHash("sha256").update(code.trim()).digest("hex");
  if (inputHash !== expectedHash) {
    return { success: false, error: "Invalid verification code. Please check your email and try again." };
  }

  // Clear pending OTP and enable Email 2FA
  const { pendingEmailOtpHash, pendingEmailOtpExpiresAt, ...cleanedPrefs } = existingPrefs;
  const updatedPrefs = {
    ...cleanedPrefs,
    twoFactorEnabled: true,
    twoFactorMethod: "EMAIL",
    twoFactorActivatedAt: new Date().toISOString(),
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: updatedPrefs },
  });

  return {
    success: true,
    message: "Email two-factor authentication enabled successfully.",
  };
}

/**
 * Disables Two-Factor Authentication.
 */
export async function disableTwoFactor(): Promise<SecurityActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const existingPrefs = (user?.preferences as Record<string, unknown>) || {};
  const {
    twoFactorSecret,
    pendingEmailOtpHash,
    pendingEmailOtpExpiresAt,
    ...rest
  } = existingPrefs;

  const updatedPrefs = {
    ...rest,
    twoFactorEnabled: false,
    twoFactorMethod: null,
    twoFactorDisabledAt: new Date().toISOString(),
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: updatedPrefs },
  });

  return {
    success: true,
    message: "Two-Factor Authentication has been disabled.",
  };
}

/**
 * Saves general user preferences (Notifications & Privacy) while preserving security fields.
 */
export async function savePreferences(
  nextPreferences: Partial<UserPreferences>
): Promise<SecurityActionResult<UserPreferences>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const currentRaw = (user?.preferences as Record<string, unknown>) || {};
  const mergedPrefs = {
    ...currentRaw,
    ...nextPreferences,
  };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: mergedPrefs },
  });

  const normalizedUserPrefs: UserPreferences = {
    ...defaultUserPreferences,
    ...(nextPreferences as Partial<UserPreferences>),
  };

  return {
    success: true,
    message: "Preferences updated successfully.",
    data: normalizedUserPrefs,
  };
}
