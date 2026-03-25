/**
 * Rate limiting for AI-touching endpoints.
 * Uses Upstash Redis via @upstash/ratelimit.
 * Falls back gracefully if Redis is not configured (dev mode).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    // Not configured — skip rate limiting in development
    return null;
  }

  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "pm_platform",
  });

  return ratelimit;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (usually user ID or IP).
 * Returns success=true if the request is allowed.
 * In development without Redis, always returns success=true.
 */
export async function checkRateLimit(
  identifier: string,
  windowSeconds = 60,
  maxRequests = 10
): Promise<RateLimitResult> {
  const rl = getRatelimit();

  if (!rl) {
    // Dev mode — no rate limiting
    return { success: true, limit: maxRequests, remaining: maxRequests, reset: Date.now() + windowSeconds * 1000 };
  }

  const result = await rl.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * AI endpoint rate limiter — stricter limits.
 * 5 requests per minute per user for AI-heavy endpoints.
 */
export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai:${userId}`, 60, 5);
}
