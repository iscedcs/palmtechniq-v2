/**
 * Admin security management actions
 * For managing IP blacklists, login attempts, and account lockouts
 */

"use server";

import { db } from "@/lib/db";
import {
  blockIP,
  unblockIP,
  getIPStats,
  cleanupOldLoginAttempts,
  IP_RATE_LIMIT_CONFIG,
} from "@/lib/ip-rate-limit";
import { auth } from "@/auth";

/**
 * Get all blocked IPs (admin only)
 */
export async function getBlockedIPs() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const blockedIPs = await db.iPBlacklist.findMany({
      where: { isActive: true },
      orderBy: { blockedAt: "desc" },
    });

    return { success: true, data: blockedIPs };
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    return { error: "Failed to fetch blocked IPs" };
  }
}

/**
 * Manually block an IP address (admin only)
 */
export async function manuallyBlockIP(
  ipAddress: string,
  reason: string = "Admin block",
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    await blockIP(ipAddress, reason);
    return { success: true };
  } catch (error) {
    console.error("Error blocking IP:", error);
    return { error: "Failed to block IP" };
  }
}

/**
 * Manually unblock an IP address (admin only)
 */
export async function manuallyUnblockIP(ipAddress: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    await unblockIP(ipAddress);
    return { success: true };
  } catch (error) {
    console.error("Error unblocking IP:", error);
    return { error: "Failed to unblock IP" };
  }
}

/**
 * Get detailed statistics for a specific IP (admin only)
 */
export async function viewIPStats(ipAddress: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const stats = await getIPStats(ipAddress);
    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching IP stats:", error);
    return { error: "Failed to fetch IP statistics" };
  }
}

/**
 * Get all login attempts (admin only)
 */
export async function getLoginAttempts(filters?: {
  ipAddress?: string;
  email?: string;
  success?: boolean;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const where: any = {};
    if (filters?.ipAddress) where.ipAddress = filters.ipAddress;
    if (filters?.email) where.email = filters.email;
    if (filters?.success !== undefined) where.success = filters.success;

    const attempts = await db.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });

    return { success: true, data: attempts };
  } catch (error) {
    console.error("Error fetching login attempts:", error);
    return { error: "Failed to fetch login attempts" };
  }
}

/**
 * Unlock a user's account (admin only)
 */
export async function unlockUserAccount(userId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    await db.user.update({
      where: { id: userId },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unlocking user account:", error);
    return { error: "Failed to unlock account" };
  }
}

/**
 * Get users with locked accounts (admin only)
 */
export async function getLockedAccounts() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const lockedUsers = await db.user.findMany({
      where: {
        accountLockedUntil: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        accountLockedUntil: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        lastFailedLoginIp: true,
      },
      orderBy: { accountLockedUntil: "desc" },
    });

    return { success: true, data: lockedUsers };
  } catch (error) {
    console.error("Error fetching locked accounts:", error);
    return { error: "Failed to fetch locked accounts" };
  }
}

/**
 * Get security dashboard summary (admin only)
 */
export async function getSecurityDashboardSummary() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      failedAttempts,
      successfulAttempts,
      blockedIPs,
      lockedAccounts,
      uniqueIPs,
      uniqueEmails,
    ] = await Promise.all([
      db.loginAttempt.count({
        where: {
          success: false,
          createdAt: { gte: last24h },
        },
      }),
      db.loginAttempt.count({
        where: {
          success: true,
          createdAt: { gte: last24h },
        },
      }),
      db.iPBlacklist.count({
        where: { isActive: true },
      }),
      db.user.count({
        where: {
          accountLockedUntil: { gt: new Date() },
        },
      }),
      db.loginAttempt.findMany({
        where: { createdAt: { gte: last24h } },
        distinct: ["ipAddress"],
        select: { ipAddress: true },
      }),
      db.loginAttempt.findMany({
        where: {
          createdAt: { gte: last24h },
          email: { not: null },
        },
        distinct: ["email"],
        select: { email: true },
      }),
    ]);

    return {
      success: true,
      data: {
        last24h: {
          failedAttempts,
          successfulAttempts,
          uniqueIPAddresses: uniqueIPs.length,
          uniqueEmailsAttempted: uniqueEmails.length,
        },
        current: {
          activelyBlockedIPs: blockedIPs,
          lockedUserAccounts: lockedAccounts,
        },
        config: {
          maxAttemptsPerIP: IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_IP,
          maxAttemptsPerEmail: IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_EMAIL,
          rateLimitWindowMinutes: IP_RATE_LIMIT_CONFIG.WINDOW_MS / 60 / 1000,
          blockDurationMinutes:
            IP_RATE_LIMIT_CONFIG.BLOCK_DURATION_MS / 60 / 1000,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching security dashboard summary:", error);
    return { error: "Failed to fetch security dashboard" };
  }
}

/**
 * Clean up old login attempts (admin only, recommended to run periodically)
 */
export async function cleanupLoginAttempts(daysToKeep: number = 30) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const deletedCount = await cleanupOldLoginAttempts(daysToKeep);
    return {
      success: true,
      message: `Deleted ${deletedCount} old login attempts`,
    };
  } catch (error) {
    console.error("Error cleaning up login attempts:", error);
    return { error: "Failed to cleanup login attempts" };
  }
}

/**
 * Get suspicious activity report (admin only)
 * Shows IPs with high failed attempt counts
 */
export async function getSuspiciousActivityReport() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get IPs with high failed attempt counts
    const failedAttempts = await db.loginAttempt.groupBy({
      by: ["ipAddress"],
      where: {
        success: false,
        createdAt: { gte: last7days },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    // Get emails with high failed attempt counts
    const failedByEmail = await db.loginAttempt.groupBy({
      by: ["email"],
      where: {
        success: false,
        email: { not: null },
        createdAt: { gte: last7days },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 20,
    });

    return {
      success: true,
      data: {
        period: "Last 7 days",
        topIPsByFailedAttempts: failedAttempts.map((a) => ({
          ipAddress: a.ipAddress,
          failedAttempts: a._count.id,
        })),
        topEmailsByFailedAttempts: failedByEmail.map((a) => ({
          email: a.email,
          failedAttempts: a._count.id,
        })),
      },
    };
  } catch (error) {
    console.error("Error generating suspicious activity report:", error);
    return { error: "Failed to generate report" };
  }
}
