import { createHash, randomBytes } from "crypto";

/**
 * Token primitives (Node `crypto`, no custom crypto).
 * Session and verification/reset tokens are random; only their SHA-256 hash is
 * stored, so a database leak does not expose valid tokens.
 */

/** Generate a random opaque session token (URL-safe base64, 32 bytes). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Generate a random single-use token (verification / password reset). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash a token for storage. Deterministic; safe to unit-test. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EMAIL_VERIFY_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
