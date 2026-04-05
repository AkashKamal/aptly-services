// src/payment.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
var PaymentEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required")
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
export {
  PaymentEnvSchema,
  createPaymentClient,
  createPaymentClientFromEnv
};
//# sourceMappingURL=payment.mjs.map