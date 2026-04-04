import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
  external: ['@aws-sdk/client-s3', 'puppeteer', 'razorpay', 'bcrypt', 'jsonwebtoken', 'nodemailer', 'qrcode', 'node-cron'],
});
