import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

export const AuthEnvSchema = z.object({
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_SESSION_DURATION: z.string().default('24h'),
});

export type AuthEnvConfig = z.infer<typeof AuthEnvSchema>;

export interface AuthConfig {
  jwtSecret: string;
  sessionDuration: string | number;
}

export function createAuth(config: AuthConfig) {
  return {
    async hashPassword(password: string): Promise<string> {
      const saltRounds = 10;
      return bcrypt.hash(password, saltRounds);
    },

    async verifyPassword(password: string, hash: string): Promise<boolean> {
      return bcrypt.compare(password, hash);
    },

    generateToken(payload: object): string {
      return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.sessionDuration as jwt.SignOptions['expiresIn'],
      });
    },

    verifyToken<T>(token: string): T {
      return jwt.verify(token, config.jwtSecret) as T;
    }
  };
}

/**
 * Creates an auth client directly from environment variables.
 * Designed for Coolify deployments where these variables are securely injected.
 * Throws a Zod error immediately if variables are missing/invalid.
 */
export function createAuthFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsedEnv = AuthEnvSchema.parse(env);
  return createAuth({
    jwtSecret: parsedEnv.JWT_SECRET,
    sessionDuration: parsedEnv.JWT_SESSION_DURATION,
  });
}
