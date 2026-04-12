import { z } from 'zod';
import { SSOService, SSOLoginResult } from './types';

export const MicrosoftEnvSchema = z.object({
  MICROSOFT_CLIENT_ID: z.string(),
  MICROSOFT_CLIENT_SECRET: z.string(),
  MICROSOFT_TENANT_ID: z.string().default('common'),
});

export type MicrosoftEnvConfig = z.infer<typeof MicrosoftEnvSchema>;

export function createMicrosoftSSO(config: { clientId: string; clientSecret: string; tenantId: string }): SSOService {
  const baseUrl = `https://login.microsoftonline.com/${config.tenantId}`;

  return {
    getAuthUrl(redirectUri: string): string {
      const url = new URL(`${baseUrl}/oauth2/v2.0/authorize`);
      url.searchParams.set('client_id', config.clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile User.Read');
      url.searchParams.set('response_mode', 'query');
      return url.toString();
    },

    async verifyCallback(code: string, redirectUri: string): Promise<SSOLoginResult> {
      const tokenResponse = await fetch(`${baseUrl}/oauth2/v2.0/token`, {
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
        throw new Error('Microsoft token exchange failed');
      }

      const tokens = await tokenResponse.json();
      
      // Fetch user profile from Microsoft Graph
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Microsoft user info');
      }

      const user = await userResponse.json();

      return {
        email: user.mail || user.userPrincipalName,
        name: user.displayName,
        sub: user.id,
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
      };
    }
  };
}

export function createMicrosoftSSOFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsed = MicrosoftEnvSchema.parse(env);
  return createMicrosoftSSO({
    clientId: parsed.MICROSOFT_CLIENT_ID,
    clientSecret: parsed.MICROSOFT_CLIENT_SECRET,
    tenantId: parsed.MICROSOFT_TENANT_ID,
  });
}
