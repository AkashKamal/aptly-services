import Razorpay from 'razorpay';
import crypto from 'crypto';
import { z } from 'zod';

export const PaymentEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
});

export type PaymentEnvConfig = z.infer<typeof PaymentEnvSchema>;

export interface PaymentConfig {
  keyId: string;
  keySecret: string;
}

export function createPaymentClient(config: PaymentConfig) {
  const instance = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });

  return {
    /**
     * Initializes a new monetary order in Razorpay.
     * @param amount The amount in the **smallest currency subunit** (e.g., paise for INR). Rs 500 = 50000 paise.
     */
    async createOrder(amount: number, currency: string = 'INR', receiptId?: string) {
      return instance.orders.create({
        amount,
        currency,
        receipt: receiptId,
      });
    },

    /**
     * Highly critical Hexagonal Adapter function:
     * Validates that the webhook payload actually came from Razorpay.
     */
    verifyWebhookSignature(payloadBody: string, signatureHeader: string, webhookSecret: string): boolean {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadBody)
        .digest('hex');
      
      return expectedSignature === signatureHeader;
    }
  };
}

/**
 * Bootstraps Razorpay from predefined Coolify injected Environment Variables.
 */
export function createPaymentClientFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsedEnv = PaymentEnvSchema.parse(env);
  return createPaymentClient({
    keyId: parsedEnv.RAZORPAY_KEY_ID,
    keySecret: parsedEnv.RAZORPAY_KEY_SECRET,
  });
}
