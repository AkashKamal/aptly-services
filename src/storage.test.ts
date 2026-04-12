import { describe, it, expect, vi } from 'vitest';
import * as s3_presigner from '@aws-sdk/s3-request-presigner';
import { createStorageClient, createStorageClientFromEnv } from './storage';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.com')
}));

describe('Storage Module', () => {
  const config = {
    endpoint: 'https://test.endpoint.com',
    region: 'us-east-1',
    bucket: 'test-bucket',
    credentials: {
      accessKeyId: 'access',
      secretAccessKey: 'secret'
    }
  };

  const storage = createStorageClient(config);

  it('should generate pre-signed upload URL', async () => {
    const url = await storage.getUploadUrl('test-file.pdf', 'application/pdf');
    expect(url).toBe('https://signed-url.com');
    expect(s3_presigner.getSignedUrl).toHaveBeenCalled();
  });

  it('should generate pre-signed download URL', async () => {
    const url = await storage.getDownloadUrl('test-file.pdf');
    expect(url).toBe('https://signed-url.com');
  });

  it('should support custom expiration for download URLs', async () => {
    await storage.getDownloadUrl('test-file.pdf', 3600);
    expect(s3_presigner.getSignedUrl).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({ expiresIn: 3600 })
    );
  });

  it('should validate environment variables with createStorageClientFromEnv', () => {
    const validEnv = {
      S3_ENDPOINT: 'https://test.endpoint.com',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'test-bucket',
      S3_ACCESS_KEY: 'access',
      S3_SECRET_KEY: 'secret'
    };
    
    expect(createStorageClientFromEnv(validEnv)).toBeDefined();
    expect(() => createStorageClientFromEnv({})).toThrow();
  });
});
