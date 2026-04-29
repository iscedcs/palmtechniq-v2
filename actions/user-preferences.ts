"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  defaultUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

const normalizePreferences = (input?: unknown) => {
  if (!input || typeof input !== "object") {
    return { ...defaultUserPreferences };
  }

  return {
    ...defaultUserPreferences,
    ...(input as Partial<UserPreferences>),
  };
};

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) {
    return { preferences: { ...defaultUserPreferences } };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  return { preferences: normalizePreferences(user?.preferences) };
}

export async function updateUserPreferences(next: Partial<UserPreferences>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  const current = normalizePreferences(user?.preferences);
  const merged = { ...current, ...next };

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: merged },
  });

  return { preferences: merged };
}
