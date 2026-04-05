# @aptly/services — Backend Service Library

> **For AI Agents:** This is the backend service library for the Aptly modular platform. Import services from `@aptly/services` or use sub-path imports for individual modules. Every service uses Zod-validated environment variables — never hardcode secrets.

## Installation

```bash
# From GitHub (recommended for Aptly projects)
npm install github:AptlyOrg/aptly-services

# If you need PDF generation (adds ~200MB puppeteer)
npm install puppeteer
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
```

---

## <for_ai_agents> 🤖 AI AGENT INTEGRATION GUIDE

**CRITICAL: Read this section entirely before writing any backend code for an Aptly client application.**

### Architecture Rules

1. **NEVER hardcode API keys or secrets.** All services pull config from `process.env` via Zod schemas. The Coolify deployment engine injects variables at runtime.
2. **Use the `*FromEnv()` factory functions.** They validate environment variables instantly on boot — if a variable is missing, the app crashes with a clear Zod error instead of silently failing later.
3. **Use sub-path imports when possible.** `import { createAuthFromEnv } from '@aptly/services/auth'` is better than importing from the barrel — it avoids loading unused modules (especially puppeteer).
4. **PDF service requires puppeteer.** It is an optional dependency. Only install it if the client needs PDF generation. Call `pdfService.init()` once on app startup.

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
Nodemailer-based email sending with template support.

**Required env vars:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (valid email)
**Optional env vars:** `SMTP_SECURE` (`"true"` or `"false"`)

```typescript
import { createEmailClientFromEnv } from '@aptly/services/email';

const email = createEmailClientFromEnv();
await email.send({
  to: 'client@example.com',
  subject: 'Your Invoice',
  template: 'welcome',       // 'welcome' | 'alert' | 'invoice'
  data: { name: 'John' }
});
// Or send raw HTML:
await email.send({
  to: 'client@example.com',
  subject: 'Custom Email',
  html: '<h1>Hello World</h1>'
});
```

**Exported types:** `EmailConfig`, `EmailOptions`, `EmailEnvConfig`, `EmailEnvSchema`

---

#### PDF (`@aptly/services/pdf`)
Queue-isolated headless browser PDF generation. Uses a single persistent Chromium instance to prevent OOM on DigitalOcean droplets.

**Prerequisites:** `npm install puppeteer`

```typescript
import { pdfService } from '@aptly/services/pdf';

// Call once on app startup
await pdfService.init();

// Generate PDFs from HTML strings
const buffer = await pdfService.generateFromHtml('<h1>Invoice #123</h1><p>Total: ₹5,000</p>');

// On app shutdown
await pdfService.close();
```

> ⚠️ **Do NOT write raw puppeteer logic in API routes.** Always use `pdfService` — it queues requests to prevent memory spikes.

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

### Environment Variable Summary

| Module | Required Variables | Optional |
|--------|-------------------|----------|
| auth | `JWT_SECRET`, `JWT_SESSION_DURATION` | — |
| email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | `SMTP_SECURE` |
| storage | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | — |
| payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | — |
| whatsapp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | — |
| pdf | *(none, but requires `puppeteer` installed)* | — |
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
  return Response.json({ token });
}
```

</for_ai_agents>
