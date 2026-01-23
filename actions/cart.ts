"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { generateRandomAvatar } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getUserCart() {
  const user = await auth();
  if (!user) return [];

  const items = await db.cartItem.findMany({
    where: { userId: user.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          subtitle: true,
          thumbnail: true,
          price: true,
          currentPrice: true,
          basePrice: true,
          discussions: true,
          salePrice: true,
          duration: true,
          level: true,
          tutor: { select: { user: { select: { name: true, avatar: true } } } },
          reviews: { select: { rating: true } },
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.course.id,
    quantity: item.quantity,
    title: item.course.title,
    instructor: item.course.tutor?.user?.name || "PalmTechnIQ Tutor",
    instructorAvatar: item.course.tutor?.user?.avatar || generateRandomAvatar(),
    price:
      item.course.currentPrice ?? item.course.basePrice ?? item.course.price, // ✅ fallback to main price
    originalPrice:
      item.course.price ??
      item.course.basePrice ??
      item.course.currentPrice ??
      0,
    rating:
      item.course.reviews.length > 0
        ? item.course.reviews.reduce((a, r) => a + r.rating, 0) /
          item.course.reviews.length
        : 0,
    duration: item.course.duration || 0,
    thumbnail: item.course.thumbnail,
    level: item.course.level,
  }));
}

export async function addToCart(courseId: string) {
  const user = await auth();
  if (!user) return { success: false, message: "Not authenticated" };

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    await db.cartItem.upsert({
      where: { userId_courseId: { userId: user.user.id, courseId } },
      create: { userId: user.user.id, courseId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    });
    revalidatePath("/cart");
    try {
      await notify.role("STUDENT", {
        type: "info",
        title: "Added to your cart",
        message: `You added  “${course?.title} to your cart ”`,
        actionUrl: `/courses/${courseId}/checkout`,
        actionLabel: "Procced to checkout!",
        metadata: { category: "cart", courseId },
      });
    } catch (e) {
      console.warn("⚠️ Socket.IO not initialized yet, skipping emit");
    }
    return { success: true, message: "Added to cart successfully" };
  } catch (error) {
    console.error("Add to cart failed:", error);
    return { success: false, message: "Database error" };
  }
}

export async function updateCartQuantity(courseId: string, quantity: number) {
  const user = await auth();
  if (!user) throw new Error("Not authenticated");

  if (quantity <= 0) {
    await db.cartItem.delete({
      where: { userId_courseId: { userId: user.user.id, courseId } },
    });
  } else {
    await db.cartItem.update({
      where: { userId_courseId: { userId: user.user.id, courseId } },
      data: { quantity },
    });
  }

  revalidatePath("/cart");
}

export async function removeFromCart(courseId: string) {
  const user = await auth();
  if (!user) throw new Error("Not authenticated");

  await db.cartItem.delete({
    where: { userId_courseId: { userId: user.user.id, courseId } },
  });

  revalidatePath("/cart");
}

export async function clearCart() {
  const user = await auth();
  if (!user) throw new Error("Not authenticated");
  await db.cartItem.deleteMany({ where: { userId: user.user.id } });
  revalidatePath("/cart");
}
