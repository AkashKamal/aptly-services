import { z } from 'zod';

declare const AuthEnvSchema: z.ZodObject<{
    JWT_SECRET: z.ZodString;
    JWT_SESSION_DURATION: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
type AuthEnvConfig = z.infer<typeof AuthEnvSchema>;
interface AuthConfig {
    jwtSecret: string;
    sessionDuration: string | number;
}
declare function createAuth(config: AuthConfig): {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateToken(payload: object): string;
    verifyToken<T>(token: string): T;
};
/**
 * Creates an auth client directly from environment variables.
 * Designed for Coolify deployments where these variables are securely injected.
 * Throws a Zod error immediately if variables are missing/invalid.
 */
declare function createAuthFromEnv(env?: Record<string, string | undefined>): {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateToken(payload: object): string;
    verifyToken<T>(token: string): T;
};

export { type AuthConfig, type AuthEnvConfig, AuthEnvSchema, createAuth, createAuthFromEnv };
