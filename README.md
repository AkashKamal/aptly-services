# @aptly/services — Backend Service Library

> **For AI Agents:** This is the backend service library for the Aptly modular platform. Import services from `@aptly/services` or use sub-path imports for individual modules. Every service uses Zod-validated environment variables — never hardcode secrets.

## Core Principles

1.  **Lightweight & Minimal**: We strictly avoid heavy dependencies (like Puppeteer/Chromium). The library is designed to run in constrained environments with minimal memory footprint.
2.  **Strictly Validated**: Every service uses **Zod** for environment configuration. Secrets and API keys are validated on initialization—failing fast and loud if configuration is missing.
3.  **Modular by Design**: Use sub-path imports (e.g., `@aptly/services/auth`) to pull in only what you need. This keeps your production bundles small and prevents unused dependencies from being loaded.
4.  **Production-Ready Factories**: All services provide `*FromEnv()` helpers that safely bridge your environment variables to the service instances.

## Installation

```bash
# Recommended for Aptly platform projects
npm install github:AptlyOrg/aptly-services
```

## Quick Start

```typescript
// Import everything from the barrel
import { createAuthFromEnv, createEmailClientFromEnv, qrService } from '@aptly/services';

// OR import individual modules (avoids pulling in unused dependencies)
import { createAuthFromEnv } from '@aptly/services/auth';
import { createEmailClientFromEnv } from '@aptly/services/email';
import { pdfService } from '@aptly/services/pdf';
import { createStorageClientFromEnv } from '@aptly/services/storage';
import { createPaymentClientFromEnv } from '@aptly/services/payment';
import { createWhatsAppClientFromEnv } from '@aptly/services/whatsapp';
import { qrService } from '@aptly/services/qr';
import { cronService } from '@aptly/services/cron';
import { RateLimiter } from '@aptly/services/rate-limit';
import { OTPService } from '@aptly/services/otp';
import { barcodeService } from '@aptly/services/barcode';
```

---

## <for_ai_agents> 🤖 AI AGENT INTEGRATION GUIDE

**CRITICAL: Read this section entirely before writing any backend code for an Aptly client application.**

### Architecture Rules

1. **NEVER hardcode API keys or secrets.** All services pull config from `process.env` via Zod schemas. The Coolify deployment engine injects variables at runtime.
2. **Use the `*FromEnv()` factory functions.** They validate environment variables instantly on boot — if a variable is missing, the app crashes with a clear Zod error instead of silently failing later.
3. **Use sub-path imports when possible.** `import { createAuthFromEnv } from '@aptly/services/auth'` is better than importing from the barrel — it avoids loading unused modules (especially puppeteer).
4. **PDF service is lightweight.** It uses `pdfmake` to generate PDFs natively in Node.js without needing a headless browser (no Puppeteer/Chromium required).

### Module Reference

#### Auth (`@aptly/services/auth`)
JWT session management and bcrypt password hashing.

**Required env vars:** `JWT_SECRET` (min 16 chars), `JWT_SESSION_DURATION` (default: `24h`)

```typescript
import { createAuthFromEnv } from '@aptly/services/auth';

const auth = createAuthFromEnv();
const hash = await auth.hashPassword('user_password');
const isValid = await auth.verifyPassword('user_password', hash);
const token = auth.generateToken({ userId: 123, role: 'admin' });
const decoded = auth.verifyToken<{ userId: number; role: string }>(token);
```

**Exported types:** `AuthConfig`, `AuthEnvConfig`, `AuthEnvSchema`

---

#### Email (`@aptly/services/email`)
Nodemailer-based email sending with template support. Ideal for sending OTPs, welcome emails, or automated invoices.

**Required env vars:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (valid email)
**Optional env vars:** `SMTP_SECURE` (`"true"` or `"false"`)

```typescript
import { createEmailClientFromEnv } from '@aptly/services/email';

const email = createEmailClientFromEnv();

// Example: Sending a Welcome Email
await email.send({
  to: 'client@example.com',
  subject: 'Welcome to Aptly',
  template: 'welcome',
  data: { name: 'John Doe' }
});

// Example: Sending with an attachment (Invoices, Reports)
await email.send({
  to: 'client@example.com',
  subject: 'Your Monthly Invoice',
  text: 'Please find your invoice attached.',
  attachments: [{ filename: 'invoice.pdf', content: pdfBuffer }]
});
```

---

#### PDF (`@aptly/services/pdf`)
Lightweight, server-side PDF generation using `pdfmake`. No headless browser required, making it extremely memory-efficient for serverless environments.

```typescript
import { pdfService } from '@aptly/services/pdf';

// Generate complex documents with tables and styles
const docDefinition = {
  content: [
    { text: 'Sales Report', style: 'header' },
    {
      table: {
        body: [
          ['Item', 'Qty', 'Price'],
          ['Widget A', 22, '₹4,400'],
          ['Widget B', 5, '₹1,500']
        ]
      }
    }
  ],
  styles: { header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] } }
};

const pdfBuffer = await pdfService.generateDocument(docDefinition);
```

> 💡 **Tip:** Use the [pdfmake playground](http://pdfmake.org/playground.html) to design your templates and copy the resulting JSON definition directly into your code.

**Exported types:** `PDFService`

---

#### Storage (`@aptly/services/storage`)
S3-compatible object storage (works with DigitalOcean Spaces, MinIO, AWS S3).

**Required env vars:** `S3_ENDPOINT` (URL), `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

```typescript
import { createStorageClientFromEnv } from '@aptly/services/storage';

const storage = createStorageClientFromEnv();
const uploadUrl = await storage.getUploadUrl('invoices/123.pdf', 'application/pdf');
const downloadUrl = await storage.getDownloadUrl('invoices/123.pdf');
```

> Pre-signed URLs let the frontend upload/download directly — zero data passes through the backend.

**Exported types:** `StorageConfig`, `StorageEnvConfig`, `StorageEnvSchema`

---

#### Payments (`@aptly/services/payment`)
Razorpay integration for Indian MSME payment processing.

**Required env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

```typescript
import { createPaymentClientFromEnv } from '@aptly/services/payment';

const payments = createPaymentClientFromEnv();
// Amount in smallest currency unit (paise). ₹500 = 50000 paise
const order = await payments.createOrder(50000, 'INR', 'receipt_123');
// Verify webhook authenticity
const isValid = payments.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
```

**Exported types:** `PaymentConfig`, `PaymentEnvConfig`, `PaymentEnvSchema`

---

#### WhatsApp (`@aptly/services/whatsapp`)
Meta Cloud API wrapper for automated business notifications.

**Required env vars:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`

```typescript
import { createWhatsAppClientFromEnv } from '@aptly/services/whatsapp';

const wa = createWhatsAppClientFromEnv();
await wa.sendTemplateMessage({
  to: '919876543210',
  template: 'order_update',
  language: 'en',
  components: [{ type: 'body', parameters: [{ type: 'text', text: 'Order #456' }] }]
});
```

**Exported types:** `WhatsAppConfig`, `WhatsAppEnvConfig`, `SendMessageOptions`, `WhatsAppEnvSchema`

---

#### QR Code (`@aptly/services/qr`)
Stateless QR code generation for physical tracking.

**No env vars required.**

```typescript
import { qrService } from '@aptly/services/qr';

// Returns data:image/png;base64,... string
const dataUri = await qrService.generateDataUri('https://aptly.build/item/1');
// Returns raw PNG buffer
const buffer = await qrService.generateBuffer('https://aptly.build/item/1');
```

---

#### Cron Scheduler (`@aptly/services/cron`)
Lightweight task scheduling for recurring jobs.

**No env vars required.**

```typescript
import { cronService } from '@aptly/services/cron';

// Run every day at 8 AM
cronService.scheduleTask('0 8 * * *', async () => {
  // Generate and email daily inventory report
});
```

> ⚠️ Ensure only ONE container instance runs cron tasks to avoid duplicate executions.

---

#### SSO Providers (`@aptly/services/sso`)

Zero-dependency SSO integration for Google, Microsoft, and Zoho. All providers follow a unified interface.

**Required env vars:**
- **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Microsoft**: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` (optional)
- **Zoho**: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REGION` (optional, default: `com`)

```typescript
import { createGoogleSSOFromEnv, createMicrosoftSSOFromEnv, createZohoSSOFromEnv } from '@aptly/services/sso';

// 1. Initialize
const google = createGoogleSSOFromEnv();

// 2. Generate redirect URL for your "Login" button
const loginUrl = google.getAuthUrl('https://app.com/api/auth/callback/google');

// 3. Handle callback and verify code
const result = await google.verifyCallback(code, 'https://app.com/api/auth/callback/google');

console.log(result.email); // 'user@gmail.com'
console.log(result.sub);   // Unique provider ID
```

**Exported types:** `SSOService`, `SSOLoginResult`, `GoogleEnvConfig`, `MicrosoftEnvConfig`, `ZohoEnvConfig`

---

### Environment Variable Summary

| Module | Required Variables | Optional |
|--------|-------------------|----------|
| auth | `JWT_SECRET`, `JWT_SESSION_DURATION` | — |
| email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | `SMTP_SECURE` |
| storage | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | — |
| payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | — |
| whatsapp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | — |
| pdf | *(none)* | — |
| qr | *(none)* | — |
| cron | *(none)* | — |

### Standard Integration Pattern (Next.js App Router)

```typescript
// app/api/auth/login/route.ts
import { createAuthFromEnv } from '@aptly/services/auth';

const auth = createAuthFromEnv(); // Validates env vars on first import

export async function POST(req: Request) {
  const { email, password } = await req.json();
  // ... fetch user from database
  const isValid = await auth.verifyPassword(password, user.passwordHash);
  if (!isValid) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = auth.generateToken({ userId: user.id, role: user.role });
---

## Troubleshooting

### Common Issues

1.  **Missing Environment Variables**: All services use strict Zod validation. If you see a `ZodError` during initialization, check that your `.env` file (or provider settings) matches the required keys in the **Environment Variable Summary** table.
2.  **PDF Font Errors**: The PDF service defaults to `Helvetica` to avoid needing local font files. If you use custom fonts, ensure they are registered in the document definition.
3.  **Storage Access Denied**: Double-check your S3 credentials and ensure the bucket name is correct. Pre-signed URLs will successfully generate even if credentials are wrong, but will fail when used in the browser.
4.  **WhatsApp API Error 401**: Ensure your `WHATSAPP_TOKEN` is a Permanent Access Token. Temporary tokens expire after 24 hours.

## Contributing

We welcome contributions! To add a new service:

1.  Create a new file in `src/` (e.g., `src/my-service.ts`).
2.  Follow the factory pattern: export a `createMyService` and `createMyServiceFromEnv`.
3.  Add Zod validation for any new environment variables.
4.  Add a comprehensive unit test in `src/my-service.test.ts`.
5.  Export your service from `src/index.ts`.
6.  Run `npm test` and `npm run build` before submitting a PR.

</for_ai_agents>

---

#### Rate Limiter (`@aptly/services/rate-limit`)
Generic rate limiting service with pluggable strategies and stores.

- **Fixed Window**: Resets counts after a fixed duration.
- **Token Bucket**: Allows for bursts while maintaining a steady rate.

```typescript
import { RateLimiter, FixedWindowStrategy, InMemoryStore } from '@aptly/services/rate-limit';

const limiter = new RateLimiter(new FixedWindowStrategy(), new InMemoryStore());

const res = await limiter.check('user_123', { limit: 10, window: 60 });
if (!res.allowed) throw new Error('Too many requests');
```

---

#### OTP Service (`@aptly/services/otp`)
Secure OTP generation and verification.

```typescript
import { OTPService } from '@aptly/services/otp';

const otpService = new OTPService();
const code = await otpService.generate('user@example.com', { length: 6, type: 'numeric' });
const isValid = await otpService.verify('user@example.com', code);
```

---

#### Barcode (`@aptly/services/barcode`)
Pure-JS 1D barcode generation as SVG strings.

```typescript
import { barcodeService } from '@aptly/services/barcode';

const svg = barcodeService.generateSVG('ITEM123', { format: 'CODE128' });
```
