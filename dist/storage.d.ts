import { z } from 'zod';
export declare const StorageEnvSchema: z.ZodObject<{
    S3_ENDPOINT: z.ZodString;
    S3_REGION: z.ZodString;
    S3_BUCKET: z.ZodString;
    S3_ACCESS_KEY: z.ZodString;
    S3_SECRET_KEY: z.ZodString;
}, z.core.$strip>;
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
export declare function createStorageClient(config: StorageConfig): {
    /**
     * Generates a pre-signed URL so the frontend can securely upload files
     * completely bypassing the backend server (Zero Data Bloat).
     */
    getUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
};
/**
 * Instantiates the Storage client relying strictly on Coolify environment variables.
 */
export declare function createStorageClientFromEnv(env?: Record<string, string | undefined>): {
    /**
     * Generates a pre-signed URL so the frontend can securely upload files
     * completely bypassing the backend server (Zero Data Bloat).
     */
    getUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
};
//# sourceMappingURL=storage.d.ts.map