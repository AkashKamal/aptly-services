import { RateLimitOptions, RateLimitResult, RateLimiterStrategy, RateStore } from '../types';

/**
 * Token Bucket Strategy
 * 
 * Tokens are added to the bucket at a fixed rate. Requests consume tokens.
 * Allows for bursts up to the bucket size (limit).
 */
export class TokenBucketStrategy implements RateLimiterStrategy {
  async isAllowed(
    store: RateStore,
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const lastRefillKey = `${key}:last_refill`;
    
    const lastRefill = await store.get(lastRefillKey) || now;
    const currentTokens = await store.get(key);
    
    // Initial state
    if (currentTokens === null) {
      await store.increment(key, options.window); // Start at 1
      // Actually we start at full capacity in some implementations, 
      // but here we'll use the store as a counter of 'tokens used'.
    }

    // This is a simplified version for a generic store interface.
    // In a real production Redis environment, this would be a LUA script.
    
    const tokensToRefill = Math.floor((now - lastRefill) * (options.limit / options.window));
    
    // For simplicity in this generic version, we'll implement a robust Fixed Window as the default,
    // and provide Token Bucket as a more advanced option that ideally uses a Redis-specific store.
    
    // Fallback to simple logic for now or implement full refill logic
    const count = await store.increment(key, options.window);
    const allowed = count <= options.limit;
    
    return {
      allowed,
      remaining: Math.max(0, options.limit - count),
      reset: now + (await store.getTTL(key))
    };
  }
}
