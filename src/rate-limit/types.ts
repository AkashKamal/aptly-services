export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Timestamp when the limit resets
}

export interface RateStore {
  /**
   * Increments the count for a key and returns the new count.
   * Sets TTL if it's a new key.
   */
  increment(key: string, expirySeconds: number): Promise<number>;
  
  /**
   * Decrements the count for a key (used by Token Bucket).
   */
  decrement(key: string): Promise<void>;
  
  /**
   * Gets the current count for a key.
   */
  get(key: string): Promise<number | null>;

  /**
   * Gets the remaining TTL for a key in seconds.
   */
  getTTL(key: string): Promise<number>;
}

export interface RateLimitOptions {
  limit: number;
  window: number; // in seconds
}

export interface RateLimiterStrategy {
  isAllowed(
    store: RateStore,
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult>;
}
