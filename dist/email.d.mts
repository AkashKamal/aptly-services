import { z } from 'zod';

declare const EmailEnvSchema: z.ZodObject<{
    SMTP_HOST: z.ZodString;
    SMTP_PORT: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>;
    SMTP_SECURE: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean, string | undefined>>;
    SMTP_USER: z.ZodString;
    SMTP_PASS: z.ZodString;
    SMTP_FROM: z.ZodString;
}, z.core.$strip>;
type EmailEnvConfig = z.infer<typeof EmailEnvSchema>;
interface EmailConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
        user: string;
        pass: string;
    };
    fromEmail: string;
}
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    template?: 'welcome' | 'alert' | 'invoice';
    data?: Record<string, any>;
}
declare function createEmailClient(config: EmailConfig): {
    send(options: EmailOptions): Promise<string>;
};
/**
 * Creates an email client directly from environment variables.
 * Designed for Coolify deployments where these variables are securely injected.
 * Throws a Zod error immediately if variables are missing/invalid.
 */
declare function createEmailClientFromEnv(env?: Record<string, string | undefined>): {
    send(options: EmailOptions): Promise<string>;
};

export { type EmailConfig, type EmailEnvConfig, EmailEnvSchema, type EmailOptions, createEmailClient, createEmailClientFromEnv };
