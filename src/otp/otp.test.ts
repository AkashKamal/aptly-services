import { describe, it, expect, beforeEach } from 'vitest';
import { OTPService } from './index';
import { InMemoryStore } from '../rate-limit/stores/in-memory';

describe('OTP Service', () => {
  let service: OTPService;

  beforeEach(() => {
    service = new OTPService(new InMemoryStore());
  });

  it('should generate a numeric OTP of given length', async () => {
    const otp = await service.generate('user1', { length: 4, type: 'numeric' });
    expect(otp).toHaveLength(4);
    expect(/^\d+$/.test(otp)).toBe(true);
  });

  it('should verify a correct OTP', async () => {
    const id = 'user2';
    const otp = await service.generate(id);
    const isValid = await service.verify(id, otp);
    expect(isValid).toBe(true);
  });

  it('should fail verification for incorrect OTP', async () => {
    const id = 'user3';
    await service.generate(id);
    const isValid = await service.verify(id, '000000');
    expect(isValid).toBe(false);
  });
});
