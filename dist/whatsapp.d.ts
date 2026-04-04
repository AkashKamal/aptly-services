import { z } from 'zod';
export declare const WhatsAppEnvSchema: z.ZodObject<{
    WHATSAPP_TOKEN: z.ZodString;
    WHATSAPP_PHONE_ID: z.ZodString;
}, z.core.$strip>;
export type WhatsAppEnvConfig = z.infer<typeof WhatsAppEnvSchema>;
export interface WhatsAppConfig {
    token: string;
    phoneId: string;
}
export interface SendMessageOptions {
    to: string;
    template: string;
    language?: string;
    components?: any[];
}
export declare function createWhatsAppClient(config: WhatsAppConfig): {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    sendTemplateMessage(options: SendMessageOptions): Promise<any>;
};
/**
 * Validates Coolify environment variables and instantiates the WhatsApp wrapper.
 */
export declare function createWhatsAppClientFromEnv(env?: Record<string, string | undefined>): {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    sendTemplateMessage(options: SendMessageOptions): Promise<any>;
};
//# sourceMappingURL=whatsapp.d.ts.map