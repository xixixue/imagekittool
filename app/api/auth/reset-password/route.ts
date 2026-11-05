import { NextResponse } from "next/server";
import { guardRateLimit } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { deleteAllUserSessions } from "@/lib/auth/session";
import { consumeToken } from "@/lib/auth/verify-tokens";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validation/auth";

const RATE_LIMIT = 5; // 5 per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const blocked = guardRateLimit(request, "reset-password", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const userId = await consumeToken(token, "password_reset");
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Invalidate all sessions for this user after a password reset.
  await deleteAllUserSessions(userId);

  return NextResponse.json({ ok: true });
}
