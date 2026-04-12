import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWhatsAppClient, createWhatsAppClientFromEnv } from './whatsapp';

global.fetch = vi.fn();

describe('WhatsApp Module', () => {
  const config = {
    token: 'test-token',
    phoneId: 'test-id'
  };

  const client = createWhatsAppClient(config);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a template message successfully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messaging_product: 'whatsapp', messages: [{ id: 'wa-id' }] })
    });

    const info: any = await client.sendTemplateMessage({
      to: '1234567890',
      template: 'hello_world'
    });

    expect(info.messages[0].id).toBe('wa-id');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('test-id'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token'
      })
    }));
  });

  it('should send a template message with complex components', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messaging_product: 'whatsapp', messages: [{ id: 'wa-id' }] })
    });

    await client.sendTemplateMessage({
      to: '1234567890',
      template: 'order_update',
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: 'Order #123' }]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: 'VIEW_DETAILS' }]
        }
      ]
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: expect.stringContaining('VIEW_DETAILS')
    }));
  });

  it('should throw an error on API failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: { message: 'invalid' } })
    });

    await expect(client.sendTemplateMessage({ to: '1', template: 'a' })).rejects.toThrow('Failed to send WhatsApp message');
  });

  it('should validate environment variables with createWhatsAppClientFromEnv', () => {
    const validEnv = {
      WHATSAPP_TOKEN: 'valid-token',
      WHATSAPP_PHONE_ID: 'valid-id'
    };
    
    expect(createWhatsAppClientFromEnv(validEnv)).toBeDefined();
    expect(() => createWhatsAppClientFromEnv({})).toThrow();
  });
});
