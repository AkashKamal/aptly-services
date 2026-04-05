// src/auth.ts
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { z } from "zod";
var AuthEnvSchema = z.object({
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_SESSION_DURATION: z.string().default("24h")
});
function createAuth(config) {
  return {
    async hashPassword(password) {
      const saltRounds = 10;
      return bcrypt.hash(password, saltRounds);
    },
    async verifyPassword(password, hash2) {
      return bcrypt.compare(password, hash2);
    },
    generateToken(payload) {
      return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.sessionDuration
      });
    },
    verifyToken(token) {
      return jwt.verify(token, config.jwtSecret);
    }
  };
}
function createAuthFromEnv(env = process.env) {
  const parsedEnv = AuthEnvSchema.parse(env);
  return createAuth({
    jwtSecret: parsedEnv.JWT_SECRET,
    sessionDuration: parsedEnv.JWT_SESSION_DURATION
  });
}

// src/email.ts
import * as nodemailer from "nodemailer";
import { z as z2 } from "zod";
var EmailEnvSchema = z2.object({
  SMTP_HOST: z2.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z2.string().transform((val) => parseInt(val, 10)).pipe(z2.number().positive()),
  SMTP_SECURE: z2.string().optional().transform((val) => val === "true"),
  SMTP_USER: z2.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z2.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z2.string().email("SMTP_FROM must be a valid email")
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
        html: htmlContent
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

// src/pdf.ts
var puppeteer = null;
async function loadPuppeteer() {
  if (puppeteer) return puppeteer;
  try {
    puppeteer = await import("puppeteer");
    return puppeteer;
  } catch {
    throw new Error(
      '[@aptly/services] PDF generation requires "puppeteer" to be installed.\nInstall it with: npm install puppeteer\nIt is listed as an optional dependency and is only needed if you use pdfService.'
    );
  }
}
var PDFService = class {
  constructor() {
    this.browser = null;
    this.isGenerating = false;
    this.queue = [];
  }
  /**
   * Initialize the headless browser. 
   * This should be called once on application startup.
   * Throws a clear error if puppeteer is not installed.
   */
  async init() {
    if (!this.browser) {
      const pptr = await loadPuppeteer();
      this.browser = await pptr.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          // critical for Docker memory environments like Coolify
          "--disable-gpu"
        ]
      });
    }
  }
  /**
   * Process the internal queue to ensure we don't open 100 pages at once.
   */
  async processQueue() {
    if (this.isGenerating || this.queue.length === 0) return;
    this.isGenerating = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("PDF Worker Queue Error:", err);
      }
    }
    this.isGenerating = false;
    this.processQueue();
  }
  /**
   * Generates a PDF from an HTML string using a queue mechanism.
   * Only one PDF is generated at a time by this instance to guarantee stable memory.
   */
  async generateFromHtml(html) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        if (!this.browser) {
          return reject(new Error("PDFService is not initialized. Call init() first."));
        }
        let page;
        try {
          page = await this.browser.newPage();
          await page.setContent(html, { waitUntil: "networkidle0" });
          const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
          });
          resolve(Buffer.from(pdfBuffer));
        } catch (error) {
          reject(error);
        } finally {
          if (page) {
            await page.close();
          }
        }
      });
      this.processQueue();
    });
  }
  /**
   * Graceful shutdown function to close the browser cleanly.
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
};
var pdfService = new PDFService();

// src/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z as z3 } from "zod";
var StorageEnvSchema = z3.object({
  S3_ENDPOINT: z3.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: z3.string().min(1, "S3_REGION is required"),
  S3_BUCKET: z3.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY: z3.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: z3.string().min(1, "S3_SECRET_KEY is required")
});
function createStorageClient(config) {
  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: config.credentials,
    forcePathStyle: true
    // Typically needed for DigitalOcean Spaces or MinIO
  });
  return {
    /**
     * Generates a pre-signed URL so the frontend can securely upload files
     * completely bypassing the backend server (Zero Data Bloat).
     */
    async getUploadUrl(key, contentType, expiresInSeconds = 3600) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType
      });
      return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    },
    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    async getDownloadUrl(key, expiresInSeconds = 3600) {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key
      });
      return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    }
  };
}
function createStorageClientFromEnv(env = process.env) {
  const parsedEnv = StorageEnvSchema.parse(env);
  return createStorageClient({
    endpoint: parsedEnv.S3_ENDPOINT,
    region: parsedEnv.S3_REGION,
    bucket: parsedEnv.S3_BUCKET,
    credentials: {
      accessKeyId: parsedEnv.S3_ACCESS_KEY,
      secretAccessKey: parsedEnv.S3_SECRET_KEY
    }
  });
}

// src/qr.ts
import * as QRCode from "qrcode";
var qrService = {
  /**
   * Generates a base64 encoded data URI string of the QR code.
   * Format: `data:image/png;base64,...`
   */
  async generateDataUri(data, options) {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        ...options
      });
    } catch (error) {
      console.error("QR Generation ERror:", error);
      throw new Error("Failed to generate QR Code Data URI");
    }
  },
  /**
   * Generates raw buffer representation of a QR Code png.
   */
  async generateBuffer(data, options) {
    try {
      return await QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        ...options
      });
    } catch (error) {
      console.error("QR Generation Buffer Error:", error);
      throw new Error("Failed to generate QR Code Buffer");
    }
  }
};

// src/whatsapp.ts
import { z as z4 } from "zod";
var WhatsAppEnvSchema = z4.object({
  WHATSAPP_TOKEN: z4.string().min(1, "WHATSAPP_TOKEN is required"),
  WHATSAPP_PHONE_ID: z4.string().min(1, "WHATSAPP_PHONE_ID is required")
});
function createWhatsAppClient(config) {
  const baseUrl = `https://graph.facebook.com/v17.0/${config.phoneId}/messages`;
  return {
    /**
     * Sends a template message via Meta WhatsApp Cloud API.
     */
    async sendTemplateMessage(options) {
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.template,
          language: {
            code: options.language || "en"
          },
          components: options.components || []
        }
      };
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("WhatsApp API Error:", JSON.stringify(errorData, null, 2));
        throw new Error("Failed to send WhatsApp message");
      }
      return response.json();
    }
  };
}
function createWhatsAppClientFromEnv(env = process.env) {
  const parsedEnv = WhatsAppEnvSchema.parse(env);
  return createWhatsAppClient({
    token: parsedEnv.WHATSAPP_TOKEN,
    phoneId: parsedEnv.WHATSAPP_PHONE_ID
  });
}

// src/payment.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import { z as z5 } from "zod";
var PaymentEnvSchema = z5.object({
  RAZORPAY_KEY_ID: z5.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z5.string().min(1, "RAZORPAY_KEY_SECRET is required")
});
function createPaymentClient(config) {
  const instance = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret
  });
  return {
    /**
     * Initializes a new monetary order in Razorpay.
     * @param amount The amount in the **smallest currency subunit** (e.g., paise for INR). Rs 500 = 50000 paise.
     */
    async createOrder(amount, currency = "INR", receiptId) {
      return instance.orders.create({
        amount,
        currency,
        receipt: receiptId
      });
    },
    /**
     * Highly critical Hexagonal Adapter function:
     * Validates that the webhook payload actually came from Razorpay.
     */
    verifyWebhookSignature(payloadBody, signatureHeader, webhookSecret) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payloadBody).digest("hex");
      return expectedSignature === signatureHeader;
    }
  };
}
function createPaymentClientFromEnv(env = process.env) {
  const parsedEnv = PaymentEnvSchema.parse(env);
  return createPaymentClient({
    keyId: parsedEnv.RAZORPAY_KEY_ID,
    keySecret: parsedEnv.RAZORPAY_KEY_SECRET
  });
}

// src/cron.ts
import cron from "node-cron";
var cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * Example: `0 8 * * *` = Run every day at 8:00 AM
   * 
   * @returns A Task object that can be `.stop()`ped later if needed.
   */
  scheduleTask(cronExpression, taskFunction) {
    const valid = cron.validate(cronExpression);
    if (!valid) {
      throw new Error(`Invalid cron expression provided: ${cronExpression}`);
    }
    const scheduledJob = cron.schedule(cronExpression, async () => {
      try {
        await taskFunction();
      } catch (e) {
        console.error(`Error executing cron task [${cronExpression}]:`, e);
      }
    });
    return scheduledJob;
  }
};
export {
  AuthEnvSchema,
  EmailEnvSchema,
  PDFService,
  PaymentEnvSchema,
  StorageEnvSchema,
  WhatsAppEnvSchema,
  createAuth,
  createAuthFromEnv,
  createEmailClient,
  createEmailClientFromEnv,
  createPaymentClient,
  createPaymentClientFromEnv,
  createStorageClient,
  createStorageClientFromEnv,
  createWhatsAppClient,
  createWhatsAppClientFromEnv,
  cronService,
  pdfService,
  qrService
};
//# sourceMappingURL=index.mjs.map