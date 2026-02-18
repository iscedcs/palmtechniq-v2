"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/schemas";

import getUserByEmail from "@/data/user";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";

import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";
import {
  generatePasswordResetToken,
  generateverificationToken,
} from "@/lib/token";
import {
  checkIPRateLimit,
  recordLoginAttempt,
  getClientIp,
  IP_RATE_LIMIT_CONFIG,
} from "@/lib/ip-rate-limit";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import z from "zod";

// Signup Action
export async function signup(data: z.infer<typeof signupSchema>) {
  try {
    // Validate input
    const validated = signupSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid fields!" };
    }

    const { name, email, phone, password, confirmPassword, terms } =
      validated.data;
    // Hash password
    const hashed = await hashPassword(password);

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { error: "Email already in use" };
    }

    const verificationToken = await generateverificationToken(email);

    // Create user
    await db.user.create({
      data: {
        email: email,
        name: name,
        phone: phone,
        password: hashed,
        role: "USER" as UserRole,
        verificationToken: verificationToken.token,
      },
    });

    const { sendVerificationEmail } = await import("@/lib/mail");
    // Send verification email
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Confirmation email sent!" };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "Failed to create account" };
  }
}

/**
 * Authenticates a user with email and password
 * @param values - Login form data (email, password)
 * @param callbackUrl - Optional redirect URL after login
 * @returns Success or error response with optional redirect URL
 */
export async function login(
  values: z.infer<typeof loginSchema>,
  callbackUrl?: string | null,
) {
  try {
    // Get client IP address
    const headersList = await headers();
    const ipAddress = getClientIp(headersList);
    const userAgent = headersList.get("user-agent") || undefined;

    // Validate input first
    const validated = loginSchema.safeParse(values);
    if (!validated.success) {
      return { error: "Invalid fields!" };
    }

    const { email, password } = validated.data;

    // Check IP-based rate limiting BEFORE checking database
    const ipRateLimitCheck = await checkIPRateLimit({
      ipAddress,
      email,
      userAgent,
      maxAttempts: IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_IP,
      windowMs: IP_RATE_LIMIT_CONFIG.WINDOW_MS,
    });

    if (ipRateLimitCheck.isBlocked) {
      // Record the attempt
      await recordLoginAttempt({
        ipAddress,
        email,
        userAgent,
        success: false,
      });

      console.warn(
        `Login attempt blocked - IP: ${ipAddress}, Email: ${email}, Reason: Too many attempts`,
      );

      return {
        error:
          ipRateLimitCheck.reason ||
          "Too many login attempts. Please try again later.",
      };
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);

    // If user doesn't exist, still record the attempt to prevent enumeration
    if (!existingUser) {
      await recordLoginAttempt({
        ipAddress,
        email,
        userAgent,
        success: false,
      });

      // Don't reveal if email exists or not (security best practice)
      return { error: "Invalid email or password" };
    }

    // Check if user account is locked due to too many failed login attempts
    if (
      existingUser.accountLockedUntil &&
      new Date() < existingUser.accountLockedUntil
    ) {
      const minutesRemaining = Math.ceil(
        (existingUser.accountLockedUntil.getTime() - Date.now()) / 60000,
      );

      await recordLoginAttempt({
        ipAddress,
        email,
        userAgent,
        success: false,
      });

      console.warn(
        `Account locked - Email: ${email}, Locked until: ${existingUser.accountLockedUntil}`,
      );

      return {
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`,
      };
    }

    // Check if email is verified
    if (
      !existingUser.emailVerified ||
      !existingUser.email ||
      !existingUser.password
    ) {
      const verificationToken = await generateverificationToken(email);
      const { sendVerificationEmail } = await import("@/lib/mail");

      try {
        await sendVerificationEmail(
          verificationToken.email,
          verificationToken.token,
        );

        await recordLoginAttempt({
          ipAddress,
          email,
          userAgent,
          success: false,
        });
      } catch (mailError) {
        console.error("Verification email failed:", mailError);
        return {
          error: "Unable to send verification email. Please try again later.",
        };
      }

      return {
        success: "Confirmation email sent! Please check your inbox.",
      };
    }

    // Attempt to sign in
    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Record successful login
      await recordLoginAttempt({
        ipAddress,
        email,
        userAgent,
        success: true,
      });

      // Reset failed login attempts on successful login
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      });

      return {
        success: "Successfully Signed in!",
        redirectUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
      };
    } catch (signInError) {
      // Login failed - increment failed attempts
      const failedAttempts = (existingUser.failedLoginAttempts || 0) + 1;
      let shouldLock = false;
      let lockUntil: Date | null = null;

      // Lock account after 5 failed attempts within window
      if (failedAttempts >= IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_EMAIL) {
        shouldLock = true;
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
      }

      // Update user with failed attempt info
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLockedUntil: lockUntil,
          lastFailedLoginAt: new Date(),
          lastFailedLoginIp: ipAddress,
        },
      });

      // Record failed login attempt
      await recordLoginAttempt({
        ipAddress,
        email,
        userAgent,
        success: false,
      });

      console.warn(
        `Failed login - Email: ${email}, IP: ${ipAddress}, Attempts: ${failedAttempts}${shouldLock ? " [ACCOUNT LOCKED]" : ""}`,
      );

      if (shouldLock) {
        return {
          error: `Too many failed login attempts. Your account has been locked for security. Please try again in 15 minutes or reset your password.`,
        };
      }

      if (signInError instanceof AuthError) {
        switch (signInError.type) {
          case "CredentialsSignin":
            return { error: "Invalid email or password" };
          default:
            return { error: "Failed to login!" };
        }
      }

      throw signInError;
    }
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Failed to login!" };
      }
    } else if (error instanceof RateLimitError) {
      return { error: error.message };
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Error in Login:", error);
    }
    return { error: "An unexpected error occurred!" };
  }
}

// Forgot Password Action
export async function forgotPassword(
  data: z.infer<typeof forgotPasswordSchema>,
) {
  try {
    // Validate input
    const validated = forgotPasswordSchema.safeParse(data);

    if (!validated.success) {
      return { error: "Invalid email" };
    }

    const { email } = validated.data;

    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return { error: "Email not found" };
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(email);

    const { sendPasswordResetToken } = await import("@/lib/mail");

    await sendPasswordResetToken(
      (await resetToken).email,
      (await resetToken).token,
    );

    return { success: "Reset email sent!" };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { error: "Failed to send reset link" };
  }
}

// Reset Password Action
export async function resetPassword(
  data: z.infer<typeof resetPasswordSchema>,
  token?: string | null,
) {
  try {
    if (!token) {
      return { error: "Missing token!" };
    }
    // Validate input
    const validated = resetPasswordSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid fields!" };
    }
    const { password } = validated.data;

    const existingToken = await getPasswordResetTokenByToken(token);

    const hasExpired = new Date(existingToken?.expires!) < new Date();

    if (hasExpired) {
      return { error: "Token has exipred!" };
    }

    const existingUser = await getUserByEmail(existingToken?.email!);

    if (!existingUser) {
      return { error: "Email does not exist!" };
    }

    const hashed = await hashPassword(password);

    await db.user.update({
      where: { id: existingUser.id },
      data: { password: hashed },
    });

    await db.passwordResetToken.delete({
      where: { id: existingToken?.id },
    });

    return { success: "Password Updated! " };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Failed to reset password" };
  }
}

// Email Verification Action
export async function verifyEmail(token: string) {
  try {
    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      return { error: "Token does not exist" };
    }
    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return { error: "Token has expired" };
    }

    const existingUser = await getUserByEmail(existingToken.email);

    if (!existingUser) {
      return { error: "Email does not exist!" };
    }

    await db.user.update({
      where: { id: existingUser.id },
      data: {
        email: existingToken.email,
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    await db.verificationToken.delete({
      where: { id: existingToken.id },
    });

    if (existingUser.email && existingUser.name) {
      const { onBoardingMail } = await import("@/lib/mail");
      await onBoardingMail(existingUser.email, existingUser.name);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "User email or name not found, cannot send onboarding email",
        );
      }
    }

    return { success: "Email verified" };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in newVerification:", error);
    }
    return { error: "An error occurred. Please try again." };
  }
}
