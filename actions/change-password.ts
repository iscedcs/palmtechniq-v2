"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { changePasswordSchema } from "@/schemas";
import z from "zod";

export async function changePassword(
  data: z.infer<typeof changePasswordSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validated = changePasswordSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid fields!" };
    }

    const { newPassword } = validated.data;
    const hashed = await hashPassword(newPassword);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashed,
        mustChangePassword: false,
      },
    });

    return { success: "Password changed successfully!" };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password" };
  }
}
