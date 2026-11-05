/**
 * S3-compatible object storage configuration read from environment variables.
 *
 * Server-only. When the S3 variables are absent (the default in development),
 * the app falls back to a local Mock Storage Adapter instead of failing to
 * start — core local tools and the dev cloud flow keep working (SPEC §16, §22:
 * never fabricate credentials).
 */

export interface S3Config {
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/** Read the S3-compatible config from the environment. */
export function readS3Config(): S3Config {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  };
}

/** True only when every required S3 variable is present. */
export function isS3Configured(): boolean {
  const c = readS3Config();
  return Boolean(c.endpoint && c.bucket && c.accessKeyId && c.secretAccessKey);
}
