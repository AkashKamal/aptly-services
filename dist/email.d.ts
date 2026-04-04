import { z } from 'zod';
export declare const EmailEnvSchema: z.ZodObject<{
    SMTP_HOST: z.ZodString;
    SMTP_PORT: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>;
    SMTP_SECURE: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean, string | undefined>>;
    SMTP_USER: z.ZodString;
    SMTP_PASS: z.ZodString;
    SMTP_FROM: z.ZodString;
}, z.core.$strip>;
export type EmailEnvConfig = z.infer<typeof EmailEnvSchema>;
export interface EmailConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
        user: string;
        pass: string;
    };
    fromEmail: string;
}
export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    template?: 'welcome' | 'alert' | 'invoice';
    data?: Record<string, any>;
}
export declare function createEmailClient(config: EmailConfig): {
    send(options: EmailOptions): Promise<string>;
};
/**
 * Creates an email client directly from environment variables.
 * Designed for Coolify deployments where these variables are securely injected.
 * Throws a Zod error immediately if variables are missing/invalid.
 */
export declare function createEmailClientFromEnv(env?: Record<string, string | undefined>): {
    send(options: EmailOptions): Promise<string>;
};
//# sourceMappingURL=email.d.ts.map