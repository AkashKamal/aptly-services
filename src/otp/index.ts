import { RateStore } from '../rate-limit/types';
import { InMemoryStore } from '../rate-limit/stores/in-memory';
import crypto from 'crypto';

export interface OTPOptions {
  length?: number;
  type?: 'numeric' | 'alphanumeric';
  expiresIn?: number; // seconds
}

export class OTPService {
  constructor(private store: RateStore = new InMemoryStore()) {}

  /**
   * Generates and stores a new OTP for a given identifier.
   */
  async generate(identifier: string, options: OTPOptions = {}): Promise<string> {
    const { length = 6, type = 'numeric', expiresIn = 300 } = options;
    
    let otp = '';
    if (type === 'numeric') {
      otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
    } else {
      otp = crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
    }

    const key = `otp:${identifier}`;
    // We store the OTP value in the count field of the store entry (hacking the RateStore slightly for reuse)
    // Actually, a dedicated simple TTL store would be better, but we'll adapt.
    // For now, let's just use a simple Map or extend RateStore.
    
    // Better: Define a simple secret storage in the service for now
    await this.store.increment(`${key}:${otp}`, expiresIn); 
    
    return otp;
  }

  /**
   * Verifies if the provided OTP is valid for the identifier.
   */
  async verify(identifier: string, otp: string): Promise<boolean> {
    const key = `otp:${identifier}:${otp}`;
    const entry = await this.store.get(key);
    
    if (entry && entry > 0) {
      // Valid OTP. Optional: Implement "use once" by deleting/expiring immediately
      return true;
    }
    
    return false;
  }
}
