import { z } from 'zod';

declare const WhatsAppEnvSchema: z.ZodObject<{
    WHATSAPP_TOKEN: z.ZodString;
    WHATSAPP_PHONE_ID: z.ZodString;
}, z.core.$strip>;
type WhatsAppEnvConfig = z.infer<typeof WhatsAppEnvSchema>;
interface WhatsAppConfig {
    token: string;
    phoneId: string;
}
interface SendMessageOptions {
    to: string;
    template: string;
    language?: string;
    components?: any[];
}
declare function createWhatsAppClient(config: WhatsAppConfig): {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    sendTemplateMessage(options: SendMessageOptions): Promise<unknown>;
};
/**
 * Validates Coolify environment variables and instantiates the WhatsApp wrapper.
 */
declare function createWhatsAppClientFromEnv(env?: Record<string, string | undefined>): {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    sendTemplateMessage(options: SendMessageOptions): Promise<unknown>;
};

export { type SendMessageOptions, type WhatsAppConfig, type WhatsAppEnvConfig, WhatsAppEnvSchema, createWhatsAppClient, createWhatsAppClientFromEnv };
