"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(courseId: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const userId = session.user.id;

  const existing = await db.wishlist.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    await db.wishlist.delete({
      where: { userId_courseId: { userId, courseId } },
    });
    revalidatePath(`/courses/${courseId}`);
    return { success: true, removed: true, message: "Removed from wishlist" };
  } else {
    await db.wishlist.create({
      data: { userId, courseId },
    });
    revalidatePath(`/courses/${courseId}`);
    return { success: true, added: true, message: "Added to wishlist" };
  }
}

export async function checkWishlist(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;

  const existing = await db.wishlist.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  return !!existing;
}
