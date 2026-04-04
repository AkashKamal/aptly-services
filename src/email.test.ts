import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nodemailer from 'nodemailer';
import { createEmailClient, createEmailClientFromEnv } from './email';

vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Email Module', () => {
  const config = {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: { user: 'test', pass: 'pass' },
    fromEmail: 'noreply@test.com'
  };

  const client = createEmailClient(config);

  it('should send an email with simple content', async () => {
    const infoId = await client.send({
      to: 'client@example.com',
      subject: 'Test Subject',
      text: 'Test Text'
    });

    expect(infoId).toBe('test-message-id');
    const transporter = nodemailer.createTransport(config);
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'client@example.com',
      subject: 'Test Subject'
    }));
  });

  it('should handle templates correctly', async () => {
    await client.send({
      to: 'client@example.com',
      subject: 'Welcome',
      template: 'welcome',
      data: { name: 'Akash' }
    });

    const transporter = nodemailer.createTransport(config);
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Welcome, Akash!')
    }));
  });

  it('should validate environment variables with createEmailClientFromEnv', () => {
    const validEnv = {
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      SMTP_FROM: 'noreply@test.com'
    };
    
    expect(createEmailClientFromEnv(validEnv)).toBeDefined();
    expect(() => createEmailClientFromEnv({})).toThrow();
  });
});
