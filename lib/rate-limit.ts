import { Redis } from "@upstash/redis";

// Initialize Redis client for production (optional)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory store for development
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  key: string; // Unique identifier (e.g., `login:${email}` or `enroll:${userId}`)
  limit: number; // Max requests allowed in the window
  window: number; // Time window in seconds
}

/**
 * Custom error for rate limit violations
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function rateLimitInMemory({
  key,
  limit,
  window,
  now,
}: RateLimitOptions & { now: number }) {
  const windowMs = window * 1000;
  const record = inMemoryStore.get(key);
  const resetTime = now + windowMs;

  if (record && record.resetTime > now) {
    if (record.count >= limit) {
      throw new RateLimitError(
        `Rate limit exceeded for ${key}. Try again in ${Math.ceil(
          (record.resetTime - now) / 1000
        )} seconds.`
      );
    }
    inMemoryStore.set(key, {
      count: record.count + 1,
      resetTime,
    });
  } else {
    inMemoryStore.set(key, { count: 1, resetTime });
  }

  for (const [storedKey, { resetTime: storedResetTime }] of inMemoryStore) {
    if (storedResetTime < now) {
      inMemoryStore.delete(storedKey);
    }
  }
}

/**
 * Rate limits an action based on a unique key
 * @param options - Rate limit configuration (key, limit, window)
 * @throws RateLimitError if the limit is exceeded
 */
export async function rateLimiter({
  key,
  limit,
  window,
}: RateLimitOptions): Promise<void> {
  try {
    const now = Date.now();

    if (redis) {
      // Production: Use Redis for distributed rate limiting
      const redisKey = `ratelimit:${key}`;
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, window);
      const [count] = (await pipeline.exec()) as [number];

      if (count > limit) {
        throw new RateLimitError(
          `Rate limit exceeded for ${key}. Try again in ${window} seconds.`
        );
      }
    } else {
      rateLimitInMemory({ key, limit, window, now });
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    console.error("Error in rateLimit, falling back to in-memory:", error);
    try {
      rateLimitInMemory({ key, limit, window, now: Date.now() });
      return;
    } catch (fallbackError) {
      if (fallbackError instanceof RateLimitError) {
        throw fallbackError;
      }
      throw new Error("Rate limiting failed. Please try again later.");
    }
  }
}
