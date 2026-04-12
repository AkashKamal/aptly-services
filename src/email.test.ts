import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nodemailer from 'nodemailer';
import { createEmailClient, createEmailClientFromEnv } from './email';

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });

vi.mock('node-cron', () => ({
  default: {
    validate: vi.fn().mockImplementation((val) => val === '* * * * *'),
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn(),
      start: vi.fn()
    })
  }
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: (...args: any[]) => mockSendMail(...args)
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
  });

  it('should send an email with simple content', async () => {
    const infoId = await client.send({
      to: 'client@example.com',
      subject: 'Test Subject',
      text: 'Test Text'
    });

    expect(infoId).toBe('test-message-id');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
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

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Welcome, Akash!')
    }));
  });

  it('should send an email to multiple recipients', async () => {
    await client.send({
      to: ['client1@example.com', 'client2@example.com'],
      subject: 'Group Email',
      text: 'Hello all'
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: ['client1@example.com', 'client2@example.com']
    }));
  });

  it('should handle attachments (Buffer)', async () => {
    const buffer = Buffer.from('test-content');
    await client.send({
      to: 'client@example.com',
      subject: 'With Attachment',
      text: 'Check this out',
      attachments: [{ filename: 'test.txt', content: buffer }]
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      attachments: expect.arrayContaining([
        expect.objectContaining({ filename: 'test.txt' })
      ])
    }));
  });

  it('should throw error when SMTP send fails', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

    await expect(client.send({ to: 'a', subject: 'b', text: 'c' })).rejects.toThrow('SMTP Error');
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
