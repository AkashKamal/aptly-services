import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from './index';
import { FixedWindowStrategy } from './strategies/fixed-window';
import { InMemoryStore } from './stores/in-memory';

describe('Rate Limiter', () => {
  let store: InMemoryStore;
  let limiter: RateLimiter;

  beforeEach(() => {
    store = new InMemoryStore();
    limiter = new RateLimiter(new FixedWindowStrategy(), store);
  });

  it('should allow requests within the limit', async () => {
    const key = 'test-key';
    const options = { limit: 2, window: 60 };

    const res1 = await limiter.check(key, options);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = await limiter.check(key, options);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it('should block requests exceeding the limit', async () => {
    const key = 'test-key-blocked';
    const options = { limit: 1, window: 60 };

    await limiter.check(key, options);
    const res = await limiter.check(key, options);
    
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it('should reset limits after window expires', async () => {
    vi.useFakeTimers();
    const key = 'test-key-reset';
    const options = { limit: 1, window: 1 }; // 1 second window

    await limiter.check(key, options);
    
    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000);
    
    const res = await limiter.check(key, options);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0); // 1 - 1 = 0
    
    vi.useRealTimers();
  });
});
