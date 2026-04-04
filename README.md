# @aptly/services Backend Library

This robust, framework-agnostic backend service repository utilizes **Hexagonal Architecture** and leverages environment variables extensively for the **Aptly Coolify Multi-Tenant Architecture**. 

## Ideology: Process First, Zero Bloat

By centralizing the complex orchestration behind Auth, Email, and Heavy Tasks (PDF Generation) precisely here, we keep client AI generation fast and reliable. Each client project uses identical logic inside an isolated Docker container configured dynamically inside the **Coolify PaaS**.

## Architecture Highlights

1. **Hexagonal Architecture (Ports and Adapters):** Your Next.js/Express layers just orchestrate. They hand off the core business routing to these pure services. 
2. **Environment First (`Zod` validated):** Each service verifies its connection directly via `process.env`. If a Coolify variable is missing, it crashes immediately on boot with a helpful Zod error.
3. **Queue-Isolated Workers:** Heavy tasks (puppeteer) are locally queued, ensuring massive CPU jobs do not crash your API threads.

## Provided Modules

### 1. Auth Module (`src/auth.ts`)
Handles JWT session management and bcrypt hashing asynchronously.
```typescript
import { createAuthFromEnv } from '@aptly/services';

// Uses JWT_SECRET and JWT_SESSION_DURATION from process.env implicitly:
const auth = createAuthFromEnv();
const hash = await auth.hashPassword('my_password');
const token = auth.generateToken({ userId: 123 });
```

### 2. Email Module (`src/email.ts`)
Uses Nodemailer for agnostic email handling across providers.
```typescript
import { createEmailClientFromEnv } from '@aptly/services';

// Validates SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM via process.env implicitly:
const emailClient = createEmailClientFromEnv();
await emailClient.send({
  to: 'client@example.com',
  subject: 'Your Invoice',
  template: 'invoice',
  data: { ... }
});
```

### 3. PDF Worker (`src/pdf.ts`)
A lightweight, semaphore-queued Headless Browser instance using `puppeteer`. This ensures identical rendering across environments using a single browser instance, preventing typical OOM (Out Of Memory) issues when running isolated inside Docker containers.
```typescript
import { pdfService } from '@aptly/services';

// Important: Run this once on API start:
await pdfService.init();

// Use anywhere to generate a PDF buffers efficiently
const buffer = await pdfService.generateFromHtml('<h1>Invoice 123</h1>');
```

## Setup & Testing
This library builds to commonjs. During AI scaffolding, simply import components as needed. Remember to map the relevant Coolify Dashboard variables to your application.
