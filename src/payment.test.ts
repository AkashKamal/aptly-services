import { describe, it, expect, vi } from 'vitest';
import Razorpay from 'razorpay';
import { createPaymentClient, createPaymentClientFromEnv } from './payment';

const mockCreate = vi.fn().mockResolvedValue({ id: 'order-id' });

vi.mock('razorpay', () => {
  return {
    default: class {
      orders = {
        create: mockCreate
      }
    }
  };
});

describe('Payment Module', () => {
  const config = {
    keyId: 'key',
    keySecret: 'secret'
  };

  const client = createPaymentClient(config);

  it('should create an order successfully', async () => {
    const order = await client.createOrder(50000, 'INR', 'receipt-1');
    expect(order.id).toBe('order-id');
    expect(mockCreate).toHaveBeenCalledWith({
      amount: 50000,
      currency: 'INR',
      receipt: 'receipt-1'
    });
  });

  it('should verify webhook signature correctly', () => {
    const payload = 'test-payload';
    const secret = 'webhook-secret';
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    expect(client.verifyWebhookSignature(payload, signature, secret)).toBe(true);
    expect(client.verifyWebhookSignature(payload, 'wrong-sig', secret)).toBe(false);
  });

  it('should validate environment variables with createPaymentClientFromEnv', () => {
    const validEnv = {
      RAZORPAY_KEY_ID: 'key',
      RAZORPAY_KEY_SECRET: 'secret'
    };
    
    expect(createPaymentClientFromEnv(validEnv)).toBeDefined();
    expect(() => createPaymentClientFromEnv({})).toThrow();
  });
});
