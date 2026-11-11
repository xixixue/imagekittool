import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_LIFETIME_MS,
  generateSessionToken,
  hashToken,
} from "./tokens";

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
  emailVerified: boolean;
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    emailVerified: !!user.emailVerifiedAt,
  };
}

/** Create a new session for a user and return the raw token (for the cookie). */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
    },
  });
  return token;
}

/** Validate a raw session token and return the user, or null if invalid/expired. */
export async function validateSession(token: string): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return toSessionUser(session.user);
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token: hashToken(token) } }).catch(() => undefined);
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Read the session cookie (via next/headers) and return the current user.
 * Server-only. Use in server components and route handlers.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSession(token);
}
