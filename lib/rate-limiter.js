import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Create a new rate limiter with enhanced configuration
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit',
  timeout: 5000, // 5 second timeout
  ephemeralCache: new Map(), // For in-memory caching
})

// Additional rate limiter for login attempts (more strict)
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 attempts per 10 minutes
  prefix: '@upstash/ratelimit:login',
})

// Utility function to check rate limit
export async function checkRateLimit(identifier) {
  const { success, limit, remaining, reset } = await rateLimiter.limit(identifier)
  
  return {
    success,
    limit,
    remaining,
    reset: new Date(reset).getTime(),
    message: !success 
      ? `Too many requests. Try again in ${Math.ceil((new Date(reset).getTime() - Date.now())) / 1000} seconds`
      : null
  }
}