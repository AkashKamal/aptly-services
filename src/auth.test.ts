import { describe, it, expect, vi } from 'vitest';
import { createAuth, createAuthFromEnv, AuthEnvSchema } from './auth';

describe('Auth Module', () => {
  const config = {
    jwtSecret: 'test-secret-long-enough-1234567890',
    sessionDuration: '1h'
  };

  const auth = createAuth(config);

  it('should hash and verify password', async () => {
    const password = 'my-password';
    const hash = await auth.hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(await auth.verifyPassword(password, hash)).toBe(true);
    expect(await auth.verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('should generate and verify JWT token', () => {
    const payload = { userId: '123' };
    const token = auth.generateToken(payload);
    
    expect(token).toBeDefined();
    const decoded = auth.verifyToken<{ userId: string }>(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should validate environment variables using createAuthFromEnv', () => {
    const validEnv = {
      JWT_SECRET: 'test-secret-long-enough-1234567890',
      JWT_SESSION_DURATION: '24h'
    };
    
    const envAuth = createAuthFromEnv(validEnv);
    expect(envAuth).toBeDefined();
    
    const invalidEnv = {
      JWT_SECRET: 'short' // Should fail Zod validation (min 16)
    };
    
    expect(() => createAuthFromEnv(invalidEnv)).toThrow();
  });
});
