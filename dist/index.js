"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AuthEnvSchema: () => AuthEnvSchema,
  EmailEnvSchema: () => EmailEnvSchema,
  FixedWindowStrategy: () => FixedWindowStrategy,
  GoogleEnvSchema: () => GoogleEnvSchema,
  InMemoryStore: () => InMemoryStore,
  MicrosoftEnvSchema: () => MicrosoftEnvSchema,
  OTPService: () => OTPService,
  PDFService: () => PDFService,
  PaymentEnvSchema: () => PaymentEnvSchema,
  RateLimiter: () => RateLimiter,
  SSOEnvSchema: () => SSOEnvSchema,
  StorageEnvSchema: () => StorageEnvSchema,
  TokenBucketStrategy: () => TokenBucketStrategy,
  WhatsAppEnvSchema: () => WhatsAppEnvSchema,
  ZohoEnvSchema: () => ZohoEnvSchema,
  barcodeService: () => barcodeService,
  createAuth: () => createAuth,
  createAuthFromEnv: () => createAuthFromEnv,
  createEmailClient: () => createEmailClient,
  createEmailClientFromEnv: () => createEmailClientFromEnv,
  createGoogleSSO: () => createGoogleSSO,
  createGoogleSSOFromEnv: () => createGoogleSSOFromEnv,
  createMicrosoftSSO: () => createMicrosoftSSO,
  createMicrosoftSSOFromEnv: () => createMicrosoftSSOFromEnv,
  createPaymentClient: () => createPaymentClient,
  createPaymentClientFromEnv: () => createPaymentClientFromEnv,
  createStorageClient: () => createStorageClient,
  createStorageClientFromEnv: () => createStorageClientFromEnv,
  createWhatsAppClient: () => createWhatsAppClient,
  createWhatsAppClientFromEnv: () => createWhatsAppClientFromEnv,
  createZohoSSO: () => createZohoSSO,
  createZohoSSOFromEnv: () => createZohoSSOFromEnv,
  cronService: () => cronService,
  pdfService: () => pdfService,
  qrService: () => qrService
});
module.exports = __toCommonJS(src_exports);

// src/auth.ts
var jwt = __toESM(require("jsonwebtoken"));
var bcrypt = __toESM(require("bcrypt"));
var import_zod = require("zod");
var AuthEnvSchema = import_zod.z.object({
  JWT_SECRET: import_zod.z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_SESSION_DURATION: import_zod.z.string().default("24h")
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
var nodemailer = __toESM(require("nodemailer"));
var import_zod2 = require("zod");
var EmailEnvSchema = import_zod2.z.object({
  SMTP_HOST: import_zod2.z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: import_zod2.z.string().transform((val) => parseInt(val, 10)).pipe(import_zod2.z.number().positive()),
  SMTP_SECURE: import_zod2.z.string().optional().transform((val) => val === "true"),
  SMTP_USER: import_zod2.z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: import_zod2.z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: import_zod2.z.string().email("SMTP_FROM must be a valid email")
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
var pdfmakeImport = __toESM(require("pdfmake"));
var vfsFontsImport = __toESM(require("pdfmake/build/vfs_fonts"));
var pdfmake = pdfmakeImport.default || pdfmakeImport;
var vfsFonts = vfsFontsImport.pdfMake?.vfs || vfsFontsImport.default || vfsFontsImport;
var fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  }
};
var PDFService = class {
  constructor() {
    if (vfsFonts && typeof vfsFonts === "object" && pdfmake.virtualfs) {
      for (const key of Object.keys(vfsFonts)) {
        if (typeof vfsFonts[key] === "string") {
          pdfmake.virtualfs.writeFileSync(key, Buffer.from(vfsFonts[key], "base64"));
        }
      }
    }
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
          font: "Roboto",
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
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_zod3 = require("zod");
var StorageEnvSchema = import_zod3.z.object({
  S3_ENDPOINT: import_zod3.z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: import_zod3.z.string().min(1, "S3_REGION is required"),
  S3_BUCKET: import_zod3.z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY: import_zod3.z.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: import_zod3.z.string().min(1, "S3_SECRET_KEY is required")
});
function createStorageClient(config) {
  const s3 = new import_client_s3.S3Client({
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
      const command = new import_client_s3.PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType
      });
      return (0, import_s3_request_presigner.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
    },
    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    async getDownloadUrl(key, expiresInSeconds = 3600) {
      const command = new import_client_s3.GetObjectCommand({
        Bucket: config.bucket,
        Key: key
      });
      return (0, import_s3_request_presigner.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
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
var QRCode = __toESM(require("qrcode"));
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
var import_zod4 = require("zod");
var WhatsAppEnvSchema = import_zod4.z.object({
  WHATSAPP_TOKEN: import_zod4.z.string().min(1, "WHATSAPP_TOKEN is required"),
  WHATSAPP_PHONE_ID: import_zod4.z.string().min(1, "WHATSAPP_PHONE_ID is required")
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
var import_razorpay = __toESM(require("razorpay"));
var import_crypto = __toESM(require("crypto"));
var import_zod5 = require("zod");
var PaymentEnvSchema = import_zod5.z.object({
  RAZORPAY_KEY_ID: import_zod5.z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: import_zod5.z.string().min(1, "RAZORPAY_KEY_SECRET is required")
});
function createPaymentClient(config) {
  const instance = new import_razorpay.default({
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
      const expectedSignature = import_crypto.default.createHmac("sha256", webhookSecret).update(payloadBody).digest("hex");
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
var import_node_cron = __toESM(require("node-cron"));
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
    const valid = import_node_cron.default.validate(cronExpression);
    if (!valid) {
      throw new Error(`Invalid cron expression provided: ${cronExpression}`);
    }
    const scheduledJob = import_node_cron.default.schedule(cronExpression, async () => {
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
var import_zod6 = require("zod");
var SSOEnvSchema = import_zod6.z.object({
  CLIENT_ID: import_zod6.z.string(),
  CLIENT_SECRET: import_zod6.z.string()
});

// src/sso/google.ts
var import_zod7 = require("zod");
var GoogleEnvSchema = import_zod7.z.object({
  GOOGLE_CLIENT_ID: import_zod7.z.string(),
  GOOGLE_CLIENT_SECRET: import_zod7.z.string()
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
var import_zod8 = require("zod");
var MicrosoftEnvSchema = import_zod8.z.object({
  MICROSOFT_CLIENT_ID: import_zod8.z.string(),
  MICROSOFT_CLIENT_SECRET: import_zod8.z.string(),
  MICROSOFT_TENANT_ID: import_zod8.z.string().default("common")
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
var import_zod9 = require("zod");
var ZohoEnvSchema = import_zod9.z.object({
  ZOHO_CLIENT_ID: import_zod9.z.string(),
  ZOHO_CLIENT_SECRET: import_zod9.z.string(),
  ZOHO_REGION: import_zod9.z.string().default("com")
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
var import_crypto2 = __toESM(require("crypto"));
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
      otp = import_crypto2.default.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
    } else {
      otp = import_crypto2.default.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
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
var import_jsbarcode = __toESM(require("jsbarcode"));
var import_xmldom = require("xmldom");
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
    const document = new import_xmldom.DOMImplementation().createDocument(
      "http://www.w3.org/1999/xhtml",
      "html",
      null
    );
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    (0, import_jsbarcode.default)(svgNode, text, {
      xmlDocument: document,
      format,
      width,
      height,
      displayValue,
      fontSize,
      margin,
      lineColor
    });
    return new import_xmldom.XMLSerializer().serializeToString(svgNode);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.js.map