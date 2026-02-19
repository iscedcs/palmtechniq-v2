import { db } from "@/lib/db";

interface IPRateLimitOptions {
  ipAddress: string;
  email?: string;
  userAgent?: string;
  maxAttempts?: number;
  windowMs?: number; // Time window in milliseconds
}

interface BruteForceCheckResult {
  isBlocked: boolean;
  currentAttempts: number;
  remainingAttempts: number;
  resetTime?: Date;
  reason?: string;
}

/**
 * Configuration for IP-based rate limiting
 */
export const IP_RATE_LIMIT_CONFIG = {
  // Failed attempts before IP is temporarily blocked
  MAX_ATTEMPTS_PER_IP: 10,
  // Time window for counting attempts (15 minutes)
  WINDOW_MS: 15 * 60 * 1000,
  // Failed attempts per email within window
  MAX_ATTEMPTS_PER_EMAIL: 3,
  // Minimum time between login attempts from same IP (in seconds)
  MIN_INTERVAL_SECONDS: 2,
  // How long to block an IP after exceeding max attempts
  BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hour
};

/**
 * Get the client IP address from headers
 * Handles various proxy scenarios
 */
export function getClientIp(headers: Headers): string {
  // Check for common IP headers set by proxies
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-client-ip") ||
    "unknown";

  return ip.trim();
}

/**
 * Check if an IP is currently blocked
 */
export async function isIPBlocked(ipAddress: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  try {
    const blacklistEntry = await db.iPBlacklist.findUnique({
      where: { ipAddress },
    });

    if (blacklistEntry && blacklistEntry.isActive) {
      // Check if block has expired
      if (
        blacklistEntry.unblockedAt &&
        new Date() > blacklistEntry.unblockedAt
      ) {
        // Auto-unblock expired entries
        await db.iPBlacklist.update({
          where: { ipAddress },
          data: { isActive: false },
        });
        return { blocked: false };
      }

      return {
        blocked: true,
        reason:
          blacklistEntry.reason ||
          "Your IP has been temporarily blocked due to too many failed login attempts.",
      };
    }

    return { blocked: false };
  } catch (error) {
    console.error("Error checking IP blacklist:", error);
    // Fail open - don't block legitimate users if DB fails
    return { blocked: false };
  }
}

/**
 * Check and update login attempt count for an IP
 * Returns information about whether rate limit is exceeded
 */
export async function checkIPRateLimit(
  options: IPRateLimitOptions,
): Promise<BruteForceCheckResult> {
  const {
    ipAddress,
    email,
    userAgent,
    maxAttempts = IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_IP,
    windowMs = IP_RATE_LIMIT_CONFIG.WINDOW_MS,
  } = options;

  try {
    // Check if IP is blacklisted
    const blacklistCheck = await isIPBlocked(ipAddress);
    if (blacklistCheck.blocked) {
      return {
        isBlocked: true,
        currentAttempts: maxAttempts,
        remainingAttempts: 0,
        reason: blacklistCheck.reason,
      };
    }

    // Check time window for attempts
    const windowStart = new Date(Date.now() - windowMs);

    // Get failed attempts in the window for this IP
    const ipAttempts = await db.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    // Get failed attempts for email if provided
    let emailAttempts = 0;
    if (email) {
      emailAttempts = await db.loginAttempt.count({
        where: {
          email,
          success: false,
          createdAt: {
            gte: windowStart,
          },
        },
      });
    }

    const totalAttempts = Math.max(ipAttempts, emailAttempts);
    const remainingAttempts = Math.max(0, maxAttempts - totalAttempts);
    const resetTime = new Date(Date.now() + windowMs);

    // If limit exceeded, block the IP
    if (totalAttempts >= maxAttempts) {
      await blockIP(ipAddress, "Too many failed login attempts");

      return {
        isBlocked: true,
        currentAttempts: totalAttempts,
        remainingAttempts: 0,
        resetTime,
        reason: `Too many failed login attempts from your IP. Please try again in approximately ${Math.ceil(
          IP_RATE_LIMIT_CONFIG.BLOCK_DURATION_MS / 60000,
        )} minutes.`,
      };
    }

    return {
      isBlocked: false,
      currentAttempts: totalAttempts,
      remainingAttempts,
      resetTime,
    };
  } catch (error) {
    console.error("Error checking IP rate limit:", error);
    // Fail open - allow login attempts if there's a DB error
    return {
      isBlocked: false,
      currentAttempts: 0,
      remainingAttempts: IP_RATE_LIMIT_CONFIG.MAX_ATTEMPTS_PER_IP,
    };
  }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  options: IPRateLimitOptions & { success: boolean },
): Promise<void> {
  try {
    await db.loginAttempt.create({
      data: {
        ipAddress: options.ipAddress,
        email: options.email,
        success: options.success,
        userAgent: options.userAgent,
      },
    });
  } catch (error) {
    console.error("Error recording login attempt:", error);
    // Don't throw - this shouldn't block login on DB error
  }
}

/**
 * Block an IP address
 */
export async function blockIP(
  ipAddress: string,
  reason: string = "Suspicious activity",
): Promise<void> {
  try {
    const unblockTime = new Date(
      Date.now() + IP_RATE_LIMIT_CONFIG.BLOCK_DURATION_MS,
    );

    await db.iPBlacklist.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
        reason,
        isActive: true,
        unblockedAt: unblockTime,
      },
      update: {
        reason,
        isActive: true,
        unblockedAt: unblockTime,
      },
    });

    console.warn(`IP blocked: ${ipAddress} - Reason: ${reason}`);
  } catch (error) {
    console.error("Error blocking IP:", error);
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ipAddress: string): Promise<void> {
  try {
    await db.iPBlacklist.update({
      where: { ipAddress },
      data: { isActive: false },
    });

    console.info(`IP unblocked: ${ipAddress}`);
  } catch (error) {
    console.error("Error unblocking IP:", error);
  }
}

/**
 * Get statistics about a specific IP
 */
export async function getIPStats(ipAddress: string) {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const attempts = await db.loginAttempt.findMany({
      where: {
        ipAddress,
        createdAt: {
          gte: last24h,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const failed = attempts.filter((a) => !a.success).length;
    const successful = attempts.filter((a) => a.success).length;

    return {
      ipAddress,
      total: attempts.length,
      failed,
      successful,
      uniqueEmails: [...new Set(attempts.map((a) => a.email).filter(Boolean))],
      recentAttempts: attempts.slice(0, 10),
    };
  } catch (error) {
    console.error("Error getting IP stats:", error);
    return null;
  }
}

/**
 * Clean up old login attempts (run this periodically)
 */
export async function cleanupOldLoginAttempts(
  daysToKeep: number = 30,
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await db.loginAttempt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error cleaning up old login attempts:", error);
    return 0;
  }
}
