import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    auth: 'src/auth.ts',
    email: 'src/email.ts',
    pdf: 'src/pdf.ts',
    storage: 'src/storage.ts',
    payment: 'src/payment.ts',
    whatsapp: 'src/whatsapp.ts',
    qr: 'src/qr.ts',
    cron: 'src/cron.ts',
    sso: 'src/sso/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['puppeteer'],
});
