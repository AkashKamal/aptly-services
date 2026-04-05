"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/storage.ts
var storage_exports = {};
__export(storage_exports, {
  StorageEnvSchema: () => StorageEnvSchema,
  createStorageClient: () => createStorageClient,
  createStorageClientFromEnv: () => createStorageClientFromEnv
});
module.exports = __toCommonJS(storage_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_zod = require("zod");
var StorageEnvSchema = import_zod.z.object({
  S3_ENDPOINT: import_zod.z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: import_zod.z.string().min(1, "S3_REGION is required"),
  S3_BUCKET: import_zod.z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY: import_zod.z.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: import_zod.z.string().min(1, "S3_SECRET_KEY is required")
});
function createStorageClient(config) {
  const s3 = new import_client_s3.S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: config.credentials,
    forcePathStyle: true
    // Typically needed for DigitalOcean Spaces or MinIO
  });
  return {
    /**
     * Generates a pre-signed URL so the frontend can securely upload files
     * completely bypassing the backend server (Zero Data Bloat).
     */
    async getUploadUrl(key, contentType, expiresInSeconds = 3600) {
      const command = new import_client_s3.PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType
      });
      return (0, import_s3_request_presigner.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
    },
    /**
     * Generates a pre-signed URL to grant temporary access to a private document.
     */
    async getDownloadUrl(key, expiresInSeconds = 3600) {
      const command = new import_client_s3.GetObjectCommand({
        Bucket: config.bucket,
        Key: key
      });
      return (0, import_s3_request_presigner.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
    }
  };
}
function createStorageClientFromEnv(env = process.env) {
  const parsedEnv = StorageEnvSchema.parse(env);
  return createStorageClient({
    endpoint: parsedEnv.S3_ENDPOINT,
    region: parsedEnv.S3_REGION,
    bucket: parsedEnv.S3_BUCKET,
    credentials: {
      accessKeyId: parsedEnv.S3_ACCESS_KEY,
      secretAccessKey: parsedEnv.S3_SECRET_KEY
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StorageEnvSchema,
  createStorageClient,
  createStorageClientFromEnv
});
//# sourceMappingURL=storage.js.map