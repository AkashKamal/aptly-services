import { z } from 'zod';

export interface SSOLoginResult {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  idToken: string;
  accessToken?: string;
}

export interface SSOService {
  getAuthUrl(redirectUri: string): string;
  verifyCallback(code: string, redirectUri: string): Promise<SSOLoginResult>;
}

export const SSOEnvSchema = z.object({
  CLIENT_ID: z.string(),
  CLIENT_SECRET: z.string(),
});
