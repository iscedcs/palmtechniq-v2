import "server-only";

import { headers } from "next/headers";

import { getClientIp } from "@/lib/ip-rate-limit";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";

/**
 * Rate limiting for server actions.
 *
 * WHY THIS EXISTS
 *
 * `rateLimiter` throws, which is right for a route handler but wrong inside a
 * server action: an uncaught throw reaches the client as a generic server
 * error, so the user is told nothing useful and the action's own
 * `{ error: string }` contract is broken. This wraps it and returns the
 * message instead.
 *
 * TWO KEYS, NOT ONE
 *
 * Limiting by subject alone (an email, a user id) is defeated by varying the
 * subject — the classic password-reset flood walks through a list of
 * addresses, each one hit once. Limiting by IP alone is defeated by spreading
 * the same subject across hosts. So both are checked when a subject is known,
 * with the IP allowance the looser of the two.
 *
 * FAILURE MODE
 *
 * A limiter that breaks must not take the action down with it: `rateLimiter`
 * already falls back from Redis to an in-memory count, and anything it throws
 * that is not a RateLimitError is logged and allowed through. Losing a limiter
 * is bad; refusing every signup because Redis blinked is worse.
 */
export type RateLimitScope = {
  /** Short, stable name for the action. Becomes part of the key. */
  name: string;
  /** Allowed attempts per window, per key. */
  limit: number;
  windowSeconds: number;
  /** Email, user id — whatever identifies the target of the action. */
  subject?: string | null;
  /**
   * Overrides the caller's IP. Only used by tests; in a request this is read
   * from the headers, which a caller cannot forge past the proxy.
   */
  ip?: string;
  /** How many times the IP may act across all subjects. Defaults to 5x limit. */
  ipLimit?: number;
};

/** Returns an error message to hand back to the user, or null when allowed. */
export async function enforceRateLimit({
  name,
  limit,
  windowSeconds,
  subject,
  ip,
  ipLimit,
}: RateLimitScope): Promise<string | null> {
  let clientIp = ip;
  if (!clientIp) {
    try {
      clientIp = getClientIp(await headers());
    } catch {
      // Outside a request scope (a script, a background job). The subject
      // check below still applies.
      clientIp = undefined;
    }
  }

  const checks: { key: string; limit: number }[] = [];
  if (subject) {
    checks.push({ key: `${name}:subject:${subject.toLowerCase()}`, limit });
  }
  if (clientIp) {
    checks.push({
      key: `${name}:ip:${clientIp}`,
      limit: ipLimit ?? limit * 5,
    });
  }

  for (const check of checks) {
    try {
      await rateLimiter({
        key: check.key,
        limit: check.limit,
        window: windowSeconds,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return "Too many attempts. Please wait a few minutes and try again.";
      }
      // Not a limit breach — the limiter itself failed. Log and allow.
      console.error(`rate limit check failed for ${check.key}`, error);
    }
  }

  return null;
}
