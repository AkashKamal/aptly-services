import * as nodemailer from 'nodemailer';
import { z } from 'zod';

export const EmailEnvSchema = z.object({
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
  SMTP_SECURE: z.string().optional().transform((val) => val === 'true'),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().email("SMTP_FROM must be a valid email"),
});

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

export function createEmailClient(config: EmailConfig) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? false,
    auth: config.auth,
  });

  return {
    async send(options: EmailOptions) {
      let htmlContent = options.html;
      
      // Basic mock templating for demonstration
      if (options.template === 'welcome' && options.data) {
        htmlContent = `<h1>Welcome, ${options.data.name}!</h1><p>We are happy to have you.</p>`;
      } else if (options.template === 'alert' && options.data) {
        htmlContent = `<h1>Alert: ${options.data.alertName}</h1><p>${options.data.message}</p>`;
      }

      const info = await transporter.sendMail({
        from: config.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: htmlContent,
      });

      return info.messageId;
    }
  };
}

/**
 * Creates an email client directly from environment variables.
 * Designed for Coolify deployments where these variables are securely injected.
 * Throws a Zod error immediately if variables are missing/invalid.
 */
export function createEmailClientFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsedEnv = EmailEnvSchema.parse(env);
  
  return createEmailClient({
    host: parsedEnv.SMTP_HOST,
    port: parsedEnv.SMTP_PORT,
    secure: parsedEnv.SMTP_SECURE,
    auth: {
      user: parsedEnv.SMTP_USER,
      pass: parsedEnv.SMTP_PASS,
    },
    fromEmail: parsedEnv.SMTP_FROM,
  });
}
