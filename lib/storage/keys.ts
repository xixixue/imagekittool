import { createHash, randomUUID } from "node:crypto";

/**
 * Generate a server-side random object key (SPEC §7.2: object keys are
 * server-generated, never client-controlled). Flat, filesystem-safe, and
 * unguessable so it doubles as a capability for the mock presigned URL.
 */
export function generateObjectKey(): string {
  const rand = randomUUID().replace(/-/g, "");
  const hash = createHash("sha256").update(`${Date.now()}-${rand}`).digest("hex");
  return hash.slice(0, 32);
}

/**
 * Random idempotency key for an upload task, so retried create/complete
 * requests are deduplicated (SPEC §7.5: all operations idempotent).
 */
export function generateIdempotencyKey(): string {
  return randomUUID();
}
