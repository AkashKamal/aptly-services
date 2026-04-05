import * as razorpay_dist_types_orders from 'razorpay/dist/types/orders';
import { z } from 'zod';

declare const PaymentEnvSchema: z.ZodObject<{
    RAZORPAY_KEY_ID: z.ZodString;
    RAZORPAY_KEY_SECRET: z.ZodString;
}, z.core.$strip>;
type PaymentEnvConfig = z.infer<typeof PaymentEnvSchema>;
interface PaymentConfig {
    keyId: string;
    keySecret: string;
}
declare function createPaymentClient(config: PaymentConfig): {
    /**
     * Initializes a new monetary order in Razorpay.
     * @param amount The amount in the **smallest currency subunit** (e.g., paise for INR). Rs 500 = 50000 paise.
     */
    createOrder(amount: number, currency?: string, receiptId?: string): Promise<razorpay_dist_types_orders.Orders.RazorpayOrder>;
    /**
     * Highly critical Hexagonal Adapter function:
     * Validates that the webhook payload actually came from Razorpay.
     */
    verifyWebhookSignature(payloadBody: string, signatureHeader: string, webhookSecret: string): boolean;
};
/**
 * Bootstraps Razorpay from predefined Coolify injected Environment Variables.
 */
declare function createPaymentClientFromEnv(env?: Record<string, string | undefined>): {
    /**
     * Initializes a new monetary order in Razorpay.
     * @param amount The amount in the **smallest currency subunit** (e.g., paise for INR). Rs 500 = 50000 paise.
     */
    createOrder(amount: number, currency?: string, receiptId?: string): Promise<razorpay_dist_types_orders.Orders.RazorpayOrder>;
    /**
     * Highly critical Hexagonal Adapter function:
     * Validates that the webhook payload actually came from Razorpay.
     */
    verifyWebhookSignature(payloadBody: string, signatureHeader: string, webhookSecret: string): boolean;
};

export { type PaymentConfig, type PaymentEnvConfig, PaymentEnvSchema, createPaymentClient, createPaymentClientFromEnv };
