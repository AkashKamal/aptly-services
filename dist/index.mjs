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

// src/pdf.ts
import * as pdfmakeImport from "pdfmake";
var pdfmake = pdfmakeImport.default || pdfmakeImport;
var fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique"
  }
};
var PDFService = class {
  constructor() {
    pdfmake.setFonts(fonts);
  }
  /**
   * Generates a PDF from a pdfmake document definition.
   */
  async generateDocument(docDefinition) {
    try {
      const def = {
        ...docDefinition,
        defaultStyle: {
          font: "Helvetica",
          ...docDefinition.defaultStyle
        }
      };
      const pdfDoc = pdfmake.createPdf(def);
      return await pdfDoc.getBuffer();
    } catch (error) {
      console.error("[@aptly/services] PDF Generation Error:", error);
      throw error;
    }
  }
  /**
   * Graceful shutdown. No-op for pdfmake, but kept for backwards compatibility.
   */
  async close() {
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
var taskRegistry = /* @__PURE__ */ new Map();
var cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * 
   * @param cronExpression Standard cron string
   * @param taskFunction Async function to execute
   * @param name Optional unique name for the task (allows stopping it later)
   * @returns The node-cron job object
   */
  scheduleTask(cronExpression, taskFunction, name) {
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
    if (name) {
      taskRegistry.set(name, scheduledJob);
    }
    return scheduledJob;
  },
  /**
   * Stop and remove a named task.
   */
  stopTask(name) {
    const task = taskRegistry.get(name);
    if (!task) {
      throw new Error(`Cron task [${name}] not found`);
    }
    task.stop();
    taskRegistry.delete(name);
  }
};

// src/sso/types.ts
import { z as z6 } from "zod";
var SSOEnvSchema = z6.object({
  CLIENT_ID: z6.string(),
  CLIENT_SECRET: z6.string()
});

// src/sso/google.ts
import { z as z7 } from "zod";
var GoogleEnvSchema = z7.object({
  GOOGLE_CLIENT_ID: z7.string(),
  GOOGLE_CLIENT_SECRET: z7.string()
});
function createGoogleSSO(config) {
  return {
    getAuthUrl(redirectUri) {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "select_account");
      return url.toString();
    },
    async verifyCallback(code, redirectUri) {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      if (!tokenResponse.ok) {
        throw new Error("Google token exchange failed");
      }
      const tokens = await tokenResponse.json();
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`
        }
      });
      if (!userResponse.ok) {
        throw new Error("Failed to fetch Google user info");
      }
      const user = await userResponse.json();
      return {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
        idToken: tokens.id_token,
        accessToken: tokens.access_token
      };
    }
  };
}
function createGoogleSSOFromEnv(env = process.env) {
  const parsed = GoogleEnvSchema.parse(env);
  return createGoogleSSO({
    clientId: parsed.GOOGLE_CLIENT_ID,
    clientSecret: parsed.GOOGLE_CLIENT_SECRET
  });
}

// src/sso/microsoft.ts
import { z as z8 } from "zod";
var MicrosoftEnvSchema = z8.object({
  MICROSOFT_CLIENT_ID: z8.string(),
  MICROSOFT_CLIENT_SECRET: z8.string(),
  MICROSOFT_TENANT_ID: z8.string().default("common")
});
function createMicrosoftSSO(config) {
  const baseUrl = `https://login.microsoftonline.com/${config.tenantId}`;
  return {
    getAuthUrl(redirectUri) {
      const url = new URL(`${baseUrl}/oauth2/v2.0/authorize`);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile User.Read");
      url.searchParams.set("response_mode", "query");
      return url.toString();
    },
    async verifyCallback(code, redirectUri) {
      const tokenResponse = await fetch(`${baseUrl}/oauth2/v2.0/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      if (!tokenResponse.ok) {
        throw new Error("Microsoft token exchange failed");
      }
      const tokens = await tokenResponse.json();
      const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`
        }
      });
      if (!userResponse.ok) {
        throw new Error("Failed to fetch Microsoft user info");
      }
      const user = await userResponse.json();
      return {
        email: user.mail || user.userPrincipalName,
        name: user.displayName,
        sub: user.id,
        idToken: tokens.id_token,
        accessToken: tokens.access_token
      };
    }
  };
}
function createMicrosoftSSOFromEnv(env = process.env) {
  const parsed = MicrosoftEnvSchema.parse(env);
  return createMicrosoftSSO({
    clientId: parsed.MICROSOFT_CLIENT_ID,
    clientSecret: parsed.MICROSOFT_CLIENT_SECRET,
    tenantId: parsed.MICROSOFT_TENANT_ID
  });
}

// src/sso/zoho.ts
import { z as z9 } from "zod";
var ZohoEnvSchema = z9.object({
  ZOHO_CLIENT_ID: z9.string(),
  ZOHO_CLIENT_SECRET: z9.string(),
  ZOHO_REGION: z9.string().default("com")
  // com, in, eu, etc.
});
function createZohoSSO(config) {
  const accountsUrl = `https://accounts.zoho.${config.region}`;
  return {
    getAuthUrl(redirectUri) {
      const url = new URL(`${accountsUrl}/oauth/v2/auth`);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "AaaServer.profile.Read");
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      return url.toString();
    },
    async verifyCallback(code, redirectUri) {
      const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Zoho token exchange failed: ${error}`);
      }
      const tokens = await tokenResponse.json();
      const userResponse = await fetch(`https://accounts.zoho.${config.region}/oauth/user/info`, {
        headers: {
          "Authorization": `Zoho-oauthtoken ${tokens.access_token}`
        }
      });
      if (!userResponse.ok) {
        throw new Error("Failed to fetch Zoho user info");
      }
      const user = await userResponse.json();
      return {
        email: user.Email,
        name: `${user.First_Name} ${user.Last_Name}`,
        sub: user.ZUID.toString(),
        idToken: tokens.id_token || "",
        // Zoho might not provide id_token if not requested/configured
        accessToken: tokens.access_token
      };
    }
  };
}
function createZohoSSOFromEnv(env = process.env) {
  const parsed = ZohoEnvSchema.parse(env);
  return createZohoSSO({
    clientId: parsed.ZOHO_CLIENT_ID,
    clientSecret: parsed.ZOHO_CLIENT_SECRET,
    region: parsed.ZOHO_REGION
  });
}

// src/rate-limit/strategies/fixed-window.ts
var FixedWindowStrategy = class {
  async isAllowed(store, key, options) {
    const count = await store.increment(key, options.window);
    const ttl = await store.getTTL(key);
    const allowed = count <= options.limit;
    return {
      allowed,
      remaining: Math.max(0, options.limit - count),
      reset: Math.floor(Date.now() / 1e3) + ttl
    };
  }
};

// src/rate-limit/stores/in-memory.ts
var InMemoryStore = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  async increment(key, expirySeconds) {
    const now = Date.now();
    const entry = this.cache.get(key);
    if (entry && entry.expiry > now) {
      entry.count += 1;
      return entry.count;
    }
    const newEntry = {
      count: 1,
      expiry: now + expirySeconds * 1e3
    };
    this.cache.set(key, newEntry);
    if (this.cache.size > 1e3) {
      this.cleanup();
    }
    return 1;
  }
  async decrement(key) {
    const entry = this.cache.get(key);
    if (entry && entry.count > 0) {
      entry.count -= 1;
    }
  }
  async get(key) {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.count;
    }
    return null;
  }
  async getTTL(key) {
    const entry = this.cache.get(key);
    if (entry) {
      const ttl = Math.max(0, entry.expiry - Date.now());
      return Math.floor(ttl / 1e3);
    }
    return 0;
  }
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
};

// src/rate-limit/strategies/token-bucket.ts
var TokenBucketStrategy = class {
  async isAllowed(store, key, options) {
    const now = Math.floor(Date.now() / 1e3);
    const lastRefillKey = `${key}:last_refill`;
    const lastRefill = await store.get(lastRefillKey) || now;
    const currentTokens = await store.get(key);
    if (currentTokens === null) {
      await store.increment(key, options.window);
    }
    const tokensToRefill = Math.floor((now - lastRefill) * (options.limit / options.window));
    const count = await store.increment(key, options.window);
    const allowed = count <= options.limit;
    return {
      allowed,
      remaining: Math.max(0, options.limit - count),
      reset: now + await store.getTTL(key)
    };
  }
};

// src/rate-limit/index.ts
var RateLimiter = class {
  constructor(strategy = new FixedWindowStrategy(), store = new InMemoryStore()) {
    this.strategy = strategy;
    this.store = store;
  }
  /**
   * Check if the request is allowed for the given key.
   * 
   * @param key Unique identifier (IP, User ID, etc.)
   * @param options limit and window configuration
   */
  async check(key, options) {
    return this.strategy.isAllowed(this.store, key, options);
  }
};

// src/otp/index.ts
import crypto2 from "crypto";
var OTPService = class {
  constructor(store = new InMemoryStore()) {
    this.store = store;
  }
  /**
   * Generates and stores a new OTP for a given identifier.
   */
  async generate(identifier, options = {}) {
    const { length = 6, type = "numeric", expiresIn = 300 } = options;
    let otp = "";
    if (type === "numeric") {
      otp = crypto2.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
    } else {
      otp = crypto2.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
    }
    const key = `otp:${identifier}`;
    await this.store.increment(`${key}:${otp}`, expiresIn);
    return otp;
  }
  /**
   * Verifies if the provided OTP is valid for the identifier.
   */
  async verify(identifier, otp) {
    const key = `otp:${identifier}:${otp}`;
    const entry = await this.store.get(key);
    if (entry && entry > 0) {
      return true;
    }
    return false;
  }
};

// src/barcode/index.ts
import JsBarcode from "jsbarcode";
import { DOMImplementation, XMLSerializer } from "xmldom";
var barcodeService = {
  /**
   * Generates a barcode as an SVG string.
   * Pure JS implementation with no canvas or DOM dependencies.
   */
  generateSVG(text, options = {}) {
    const {
      format = "CODE128",
      width = 2,
      height = 100,
      displayValue = true,
      fontSize = 20,
      margin = 10,
      lineColor = "#000"
    } = options;
    const document = new DOMImplementation().createDocument(
      "http://www.w3.org/1999/xhtml",
      "html",
      null
    );
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgNode, text, {
      xmlDocument: document,
      format,
      width,
      height,
      displayValue,
      fontSize,
      margin,
      lineColor
    });
    return new XMLSerializer().serializeToString(svgNode);
  }
};
export {
  AuthEnvSchema,
  EmailEnvSchema,
  FixedWindowStrategy,
  GoogleEnvSchema,
  InMemoryStore,
  MicrosoftEnvSchema,
  OTPService,
  PDFService,
  PaymentEnvSchema,
  RateLimiter,
  SSOEnvSchema,
  StorageEnvSchema,
  TokenBucketStrategy,
  WhatsAppEnvSchema,
  ZohoEnvSchema,
  barcodeService,
  createAuth,
  createAuthFromEnv,
  createEmailClient,
  createEmailClientFromEnv,
  createGoogleSSO,
  createGoogleSSOFromEnv,
  createMicrosoftSSO,
  createMicrosoftSSOFromEnv,
  createPaymentClient,
  createPaymentClientFromEnv,
  createStorageClient,
  createStorageClientFromEnv,
  createWhatsAppClient,
  createWhatsAppClientFromEnv,
  createZohoSSO,
  createZohoSSOFromEnv,
  cronService,
  pdfService,
  qrService
};
//# sourceMappingURL=index.mjs.map