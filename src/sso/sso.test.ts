import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGoogleSSO } from './google';
import { createMicrosoftSSO } from './microsoft';
import { createZohoSSO } from './zoho';

describe('SSO Services', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('Google SSO', () => {
    const google = createGoogleSSO({ clientId: 'id', clientSecret: 'secret' });

    it('generates correct auth URL', () => {
      const url = google.getAuthUrl('http://localhost/callback');
      expect(url).toContain('accounts.google.com');
      expect(url).toContain('client_id=id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
    });

    it('verifies callback correctly', async () => {
      const mockTokenResponse = {
        ok: true,
        json: async () => ({ access_token: 'at', id_token: 'it' }),
      };
      const mockUserResponse = {
        ok: true,
        json: async () => ({ email: 'test@gmail.com', name: 'Test User', sub: '123' }),
      };

      (fetch as any)
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const result = await google.verifyCallback('code', 'http://localhost/callback');
      expect(result.email).toBe('test@gmail.com');
      expect(result.sub).toBe('123');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when token exchange fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 400 } as any);
      await expect(google.verifyCallback('bad-code', 'uri')).rejects.toThrow('Google token exchange failed');
    });

    it('should throw error when user info fetch fails', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'at' }) } as any)
        .mockResolvedValueOnce({ ok: false, status: 401 } as any);
      
      await expect(google.verifyCallback('code', 'uri')).rejects.toThrow('Failed to fetch Google user info');
    });
  });

  describe('Microsoft SSO', () => {
    const ms = createMicrosoftSSO({ clientId: 'id', clientSecret: 'secret', tenantId: 'common' });

    it('generates correct auth URL', () => {
      const url = ms.getAuthUrl('http://localhost/callback');
      expect(url).toContain('login.microsoftonline.com/common');
    });
  });

  describe('Zoho SSO', () => {
    const zoho = createZohoSSO({ clientId: 'id', clientSecret: 'secret', region: 'com' });

    it('generates correct auth URL', () => {
      const url = zoho.getAuthUrl('http://localhost/callback');
      expect(url).toContain('accounts.zoho.com');
    });
  });
});
