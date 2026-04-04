import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

export const StorageEnvSchema = z.object({
  S3_ENDPOINT: z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: z.string().min(1, "S3_REGION is required"),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY: z.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: z.string().min(1, "S3_SECRET_KEY is required"),
});

export type StorageEnvConfig = z.infer<typeof StorageEnvSchema>;

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export function createStorageClient(config: StorageConfig) {
  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: config.credentials,
    forcePathStyle: true, // Typically needed for DigitalOcean Spaces or MinIO
  });

  return {
    /**
     * Generates a pre-signed URL so the frontend can securely upload files
     * completely bypassing the backend server (Zero Data Bloat).
     */
    async getUploadUrl(key: string, contentType: string, expiresInSeconds: number = 3600): Promise<string> {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
      });

      return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    },

    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    async getDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    }
  };
}

/**
 * Instantiates the Storage client relying strictly on Coolify environment variables.
 */
export function createStorageClientFromEnv(env: Record<string, string | undefined> = process.env) {
  const parsedEnv = StorageEnvSchema.parse(env);
  
  return createStorageClient({
    endpoint: parsedEnv.S3_ENDPOINT,
    region: parsedEnv.S3_REGION,
    bucket: parsedEnv.S3_BUCKET,
    credentials: {
      accessKeyId: parsedEnv.S3_ACCESS_KEY,
      secretAccessKey: parsedEnv.S3_SECRET_KEY,
    }
  });
}
