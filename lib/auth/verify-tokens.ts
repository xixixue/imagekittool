import { prisma } from "@/lib/db/prisma";
import {
  EMAIL_VERIFY_LIFETIME_MS,
  PASSWORD_RESET_LIFETIME_MS,
  generateToken,
  hashToken,
} from "./tokens";

export type TokenPurpose = "email_verification" | "password_reset";

async function createTokenRecord(
  userId: string,
  purpose: TokenPurpose,
  lifetimeMs: number,
): Promise<string> {
  const raw = generateToken();
  await prisma.token.create({
    data: {
      token: hashToken(raw),
      userId,
      purpose,
      expiresAt: new Date(Date.now() + lifetimeMs),
    },
  });
  return raw;
}

export function createVerificationToken(userId: string): Promise<string> {
  return createTokenRecord(userId, "email_verification", EMAIL_VERIFY_LIFETIME_MS);
}

export function createPasswordResetToken(userId: string): Promise<string> {
  return createTokenRecord(userId, "password_reset", PASSWORD_RESET_LIFETIME_MS);
}

/**
 * Consume a single-use token. Returns the userId on success, or null if the
 * token is invalid, expired, already used, or does not match the purpose.
 * The token is marked used on success.
 */
export async function consumeToken(
  rawToken: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const record = await prisma.token.findUnique({ where: { token: hashToken(rawToken) } });
  if (!record || record.purpose !== purpose || record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  await prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
