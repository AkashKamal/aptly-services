import { RateLimitOptions, RateLimitResult, RateLimiterStrategy, RateStore } from './types';
import { FixedWindowStrategy } from './strategies/fixed-window';
import { InMemoryStore } from './stores/in-memory';

export class RateLimiter {
  constructor(
    private strategy: RateLimiterStrategy = new FixedWindowStrategy(),
    private store: RateStore = new InMemoryStore()
  ) {}

  /**
   * Check if the request is allowed for the given key.
   * 
   * @param key Unique identifier (IP, User ID, etc.)
   * @param options limit and window configuration
   */
  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    return this.strategy.isAllowed(this.store, key, options);
  }
}

// Re-export for convenience
export * from './types';
export * from './strategies/fixed-window';
export * from './strategies/token-bucket';
export * from './stores/in-memory';
