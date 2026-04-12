import { RateStore } from '../types';

interface StoreEntry {
  count: number;
  expiry: number;
}

export class InMemoryStore implements RateStore {
  private cache = new Map<string, StoreEntry>();

  async increment(key: string, expirySeconds: number): Promise<number> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry && entry.expiry > now) {
      entry.count += 1;
      return entry.count;
    }

    // New entry or expired
    const newEntry = {
      count: 1,
      expiry: now + expirySeconds * 1000,
    };
    this.cache.set(key, newEntry);
    
    // Cleanup old entries occasionally (could be more sophisticated)
    if (this.cache.size > 1000) {
      this.cleanup();
    }

    return 1;
  }

  async decrement(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry && entry.count > 0) {
      entry.count -= 1;
    }
  }

  async get(key: string): Promise<number | null> {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.count;
    }
    return null;
  }

  async getTTL(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (entry) {
      const ttl = Math.max(0, entry.expiry - Date.now());
      return Math.floor(ttl / 1000);
    }
    return 0;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}
