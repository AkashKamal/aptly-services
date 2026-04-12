import { z } from 'zod';
import { SSOService, SSOLoginResult } from './types';

export const GoogleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

export type GoogleEnvConfig = z.infer<typeof GoogleEnvSchema>;

export function createGoogleSSO(config: { clientId: string; clientSecret: string }): SSOService {
  return {
    getAuthUrl(redirectUri: string): string {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', config.clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'select_account');
      return url.toString();
    },

    async verifyCallback(code: string, redirectUri: string): Promise<SSOLoginResult> {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Google token exchange failed');
      }

      const tokens = await tokenResponse.json();
      
      // For lightweightness, we'll fetch userinfo instead of decoding JWT (avoids needing a JWT lib for decoding)
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Google user info');
      }

      const user = await userResponse.json();

      return {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
      };
    }
  };
}

export function createGoogleSSOFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsed = GoogleEnvSchema.parse(env);
  return createGoogleSSO({
    clientId: parsed.GOOGLE_CLIENT_ID,
    clientSecret: parsed.GOOGLE_CLIENT_SECRET,
  });
}
