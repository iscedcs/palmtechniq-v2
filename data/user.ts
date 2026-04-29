import { db } from "@/lib/db";
import { User } from "@prisma/client";

/**
 * Fetches a user by email with selected fields
 * @param email - User's email
 * @returns User object or null
 */
export default async function getUserByEmail(
  email: string,
): Promise<User | null> {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });
    return user;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Error fetching user by email ${email}:`, error);
    }
    return null;
  }
}

/**
 * Fetches a user by ID with minimal fields for enrollment
 * @param id - User's ID
 * @returns User object with selected fields or null
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Error fetching user with ID ₦{id}:`, error);
    }
    return null;
  }
}
