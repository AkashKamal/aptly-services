// src/email.ts
import * as nodemailer from "nodemailer";
import { z } from "zod";
var EmailEnvSchema = z.object({
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
  SMTP_SECURE: z.string().optional().transform((val) => val === "true"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().email("SMTP_FROM must be a valid email")
});
function createEmailClient(config) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? false,
    auth: config.auth
  });
  return {
    async send(options) {
      let htmlContent = options.html;
      if (options.template === "welcome" && options.data) {
        htmlContent = `<h1>Welcome, ${options.data.name}!</h1><p>We are happy to have you.</p>`;
      } else if (options.template === "alert" && options.data) {
        htmlContent = `<h1>Alert: ${options.data.alertName}</h1><p>${options.data.message}</p>`;
      }
      const info = await transporter.sendMail({
        from: config.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: htmlContent,
        attachments: options.attachments
      });
      return info.messageId;
    }
  };
}
function createEmailClientFromEnv(env = process.env) {
  const parsedEnv = EmailEnvSchema.parse(env);
  return createEmailClient({
    host: parsedEnv.SMTP_HOST,
    port: parsedEnv.SMTP_PORT,
    secure: parsedEnv.SMTP_SECURE,
    auth: {
      user: parsedEnv.SMTP_USER,
      pass: parsedEnv.SMTP_PASS
    },
    fromEmail: parsedEnv.SMTP_FROM
  });
}
export {
  EmailEnvSchema,
  createEmailClient,
  createEmailClientFromEnv
};
//# sourceMappingURL=email.mjs.map