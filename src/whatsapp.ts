import { z } from 'zod';

export const WhatsAppEnvSchema = z.object({
  WHATSAPP_TOKEN: z.string().min(1, "WHATSAPP_TOKEN is required"),
  WHATSAPP_PHONE_ID: z.string().min(1, "WHATSAPP_PHONE_ID is required"),
});

export type WhatsAppEnvConfig = z.infer<typeof WhatsAppEnvSchema>;

export interface WhatsAppConfig {
  token: string;
  phoneId: string;
}

export interface SendMessageOptions {
  to: string;       // e.g. "919876543210"
  template: string; // The Meta approved template name
  language?: string; // default "en"
  components?: any[]; // Dynamic payload like text replacements
}

export function createWhatsAppClient(config: WhatsAppConfig) {
  const baseUrl = `https://graph.facebook.com/v17.0/${config.phoneId}/messages`;

  return {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    async sendTemplateMessage(options: SendMessageOptions) {
      const payload = {
        messaging_product: 'whatsapp',
        to: options.to,
        type: 'template',
        template: {
          name: options.template,
          language: {
            code: options.language || 'en'
          },
          components: options.components || []
        }
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', JSON.stringify(errorData, null, 2));
        throw new Error('Failed to send WhatsApp message');
      }

      return response.json();
    }
  };
}

/**
 * Validates Coolify environment variables and instantiates the WhatsApp wrapper.
 */
export function createWhatsAppClientFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsedEnv = WhatsAppEnvSchema.parse(env);
  
  return createWhatsAppClient({
    token: parsedEnv.WHATSAPP_TOKEN,
    phoneId: parsedEnv.WHATSAPP_PHONE_ID,
  });
}
