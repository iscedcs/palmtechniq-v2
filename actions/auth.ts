"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";

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
      verificationToken.token
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
  callbackUrl?: string | null
) {
  try {
    await rateLimiter({
      key: `login:${values.email}`,
      limit: 3,
      window: 60,
    });
    // Validate input
    const validated = loginSchema.safeParse(values);

    if (!validated.success) {
      return { error: "Invalid fields!" };
    }

    const { email, password } = validated.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      return { error: "Email does not exist!" };
    }

    if (
      !existingUser.emailVerified ||
      !existingUser.email ||
      !existingUser.password
    ) {
      const verificationToken = await generateverificationToken(email);

      const { sendVerificationEmail } = await import("@/lib/mail");

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );
      return {
        success: "Confirmation email sent! Please check your inbox.",
      };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return {
      success: "Successfully Signed in!",
      redirectUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Incorrect email or password" };
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
  data: z.infer<typeof forgotPasswordSchema>
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
      (
        await resetToken
      ).email,
      (
        await resetToken
      ).token
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
  token?: string | null
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
          "User email or name not found, cannot send onboarding email"
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
