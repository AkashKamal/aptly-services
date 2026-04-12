import { z } from 'zod';
import { SSOService, SSOLoginResult } from './types';

export const ZohoEnvSchema = z.object({
  ZOHO_CLIENT_ID: z.string(),
  ZOHO_CLIENT_SECRET: z.string(),
  ZOHO_REGION: z.string().default('com'), // com, in, eu, etc.
});

export type ZohoEnvConfig = z.infer<typeof ZohoEnvSchema>;

export function createZohoSSO(config: { clientId: string; clientSecret: string; region: string }): SSOService {
  const accountsUrl = `https://accounts.zoho.${config.region}`;

  return {
    getAuthUrl(redirectUri: string): string {
      const url = new URL(`${accountsUrl}/oauth/v2/auth`);
      url.searchParams.set('client_id', config.clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'AaaServer.profile.Read');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      return url.toString();
    },

    async verifyCallback(code: string, redirectUri: string): Promise<SSOLoginResult> {
      // Zoho token exchange
      const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
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
        const error = await tokenResponse.text();
        throw new Error(`Zoho token exchange failed: ${error}`);
      }

      const tokens = await tokenResponse.json();
      
      // Fetch user profile
      const userResponse = await fetch(`https://accounts.zoho.${config.region}/oauth/user/info`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Zoho user info');
      }

      const user = await userResponse.json();

      return {
        email: user.Email,
        name: `${user.First_Name} ${user.Last_Name}`,
        sub: user.ZUID.toString(),
        idToken: tokens.id_token || '', // Zoho might not provide id_token if not requested/configured
        accessToken: tokens.access_token,
      };
    }
  };
}

export function createZohoSSOFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsed = ZohoEnvSchema.parse(env);
  return createZohoSSO({
    clientId: parsed.ZOHO_CLIENT_ID,
    clientSecret: parsed.ZOHO_CLIENT_SECRET,
    region: parsed.ZOHO_REGION,
  });
}
