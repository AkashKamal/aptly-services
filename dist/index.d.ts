export { AuthConfig, AuthEnvConfig, AuthEnvSchema, createAuth, createAuthFromEnv } from './auth.js';
export { EmailConfig, EmailEnvConfig, EmailEnvSchema, EmailOptions, createEmailClient, createEmailClientFromEnv } from './email.js';
export { PDFService, pdfService } from './pdf.js';
export { StorageConfig, StorageEnvConfig, StorageEnvSchema, createStorageClient, createStorageClientFromEnv } from './storage.js';
export { qrService } from './qr.js';
export { SendMessageOptions, WhatsAppConfig, WhatsAppEnvConfig, WhatsAppEnvSchema, createWhatsAppClient, createWhatsAppClientFromEnv } from './whatsapp.js';
export { PaymentConfig, PaymentEnvConfig, PaymentEnvSchema, createPaymentClient, createPaymentClientFromEnv } from './payment.js';
export { cronService } from './cron.js';
export { GoogleEnvConfig, GoogleEnvSchema, MicrosoftEnvConfig, MicrosoftEnvSchema, SSOEnvSchema, SSOLoginResult, SSOService, ZohoEnvConfig, ZohoEnvSchema, createGoogleSSO, createGoogleSSOFromEnv, createMicrosoftSSO, createMicrosoftSSOFromEnv, createZohoSSO, createZohoSSOFromEnv } from './sso.js';
import 'zod';
import 'pdfmake/interfaces';
import 'qrcode';
import 'razorpay/dist/types/orders';
import 'node-cron';

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;
}
interface RateStore {
    /**
     * Increments the count for a key and returns the new count.
     * Sets TTL if it's a new key.
     */
    increment(key: string, expirySeconds: number): Promise<number>;
    /**
     * Decrements the count for a key (used by Token Bucket).
     */
    decrement(key: string): Promise<void>;
    /**
     * Gets the current count for a key.
     */
    get(key: string): Promise<number | null>;
    /**
     * Gets the remaining TTL for a key in seconds.
     */
    getTTL(key: string): Promise<number>;
}
interface RateLimitOptions {
    limit: number;
    window: number;
}
interface RateLimiterStrategy {
    isAllowed(store: RateStore, key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

/**
 * Fixed Window Strategy
 *
 * Divides time into fixed segments (e.g., 1-minute blocks).
 * Simplest to implement but allows up to 2x limit at window boundaries.
 */
declare class FixedWindowStrategy implements RateLimiterStrategy {
    isAllowed(store: RateStore, key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

/**
 * Token Bucket Strategy
 *
 * Tokens are added to the bucket at a fixed rate. Requests consume tokens.
 * Allows for bursts up to the bucket size (limit).
 */
declare class TokenBucketStrategy implements RateLimiterStrategy {
    isAllowed(store: RateStore, key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

declare class InMemoryStore implements RateStore {
    private cache;
    increment(key: string, expirySeconds: number): Promise<number>;
    decrement(key: string): Promise<void>;
    get(key: string): Promise<number | null>;
    getTTL(key: string): Promise<number>;
    private cleanup;
}

declare class RateLimiter {
    private strategy;
    private store;
    constructor(strategy?: RateLimiterStrategy, store?: RateStore);
    /**
     * Check if the request is allowed for the given key.
     *
     * @param key Unique identifier (IP, User ID, etc.)
     * @param options limit and window configuration
     */
    check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

interface OTPOptions {
    length?: number;
    type?: 'numeric' | 'alphanumeric';
    expiresIn?: number;
}
declare class OTPService {
    private store;
    constructor(store?: RateStore);
    /**
     * Generates and stores a new OTP for a given identifier.
     */
    generate(identifier: string, options?: OTPOptions): Promise<string>;
    /**
     * Verifies if the provided OTP is valid for the identifier.
     */
    verify(identifier: string, otp: string): Promise<boolean>;
}

interface BarcodeOptions {
    format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    lineColor?: string;
}
declare const barcodeService: {
    /**
     * Generates a barcode as an SVG string.
     * Pure JS implementation with no canvas or DOM dependencies.
     */
    generateSVG(text: string, options?: BarcodeOptions): string;
};

export { type BarcodeOptions, FixedWindowStrategy, InMemoryStore, type OTPOptions, OTPService, type RateLimitOptions, type RateLimitResult, RateLimiter, type RateLimiterStrategy, type RateStore, TokenBucketStrategy, barcodeService };
