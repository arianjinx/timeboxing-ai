import { redis } from "@/lib/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Check if Upstash Redis environment variables are defined
const isRedisConfigured =
  process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN;

// Only create the rate limiter if Redis is configured
export const rateLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(3, "60 s"), // 3 requests per minute
    })
  : null;

export async function rateLimit(identifier: string, actionName: string) {
  // If Redis is not configured, bypass rate limiting
  if (!isRedisConfigured || !rateLimiter) {
    return { success: true };
  }

  try {
    const { success } = await rateLimiter.limit(`${actionName}:${identifier}`);

    if (!success) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error(`Rate limiting error for ${actionName}:`, error);
    // Fail open - allow the request if rate limiting fails
    return { success: true };
  }
}
