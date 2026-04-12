import { RateLimitOptions, RateLimitResult, RateLimiterStrategy, RateStore } from '../types';

/**
 * Fixed Window Strategy
 * 
 * Divides time into fixed segments (e.g., 1-minute blocks).
 * Simplest to implement but allows up to 2x limit at window boundaries.
 */
export class FixedWindowStrategy implements RateLimiterStrategy {
  async isAllowed(
    store: RateStore,
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const count = await store.increment(key, options.window);
    const ttl = await store.getTTL(key);
    
    const allowed = count <= options.limit;
    
    return {
      allowed,
      remaining: Math.max(0, options.limit - count),
      reset: Math.floor(Date.now() / 1000) + ttl
    };
  }
}
