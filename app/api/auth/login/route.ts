import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { guardRateLimit } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";

const RATE_LIMIT = 10; // 10 per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes
const INVALID = "Invalid email or password.";

export async function POST(request: Request) {
  const blocked = guardRateLimit(request, "login", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Same message for missing user / wrong password to avoid enumeration.
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }

  const sessionToken = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: { email: user.email, emailVerified: !!user.emailVerifiedAt },
  });
  setSessionCookie(response, sessionToken);
  return response;
}
