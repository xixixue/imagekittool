import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { guardRateLimit } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createVerificationToken } from "@/lib/auth/verify-tokens";
import { prisma } from "@/lib/db/prisma";
import { getEmailSender } from "@/lib/email/email";
import { registerSchema } from "@/lib/validation/auth";

const RATE_LIMIT = 5; // 5 per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const blocked = guardRateLimit(request, "register", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { username, email, password } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, username, passwordHash } });

  const verifyToken = await createVerificationToken(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
  await getEmailSender().send({
    to: email,
    subject: "Verify your ImageKitTools account",
    text: `Welcome to ImageKitTools. Verify your email address:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  // Auto-login after registration (unverified; verification encouraged).
  const sessionToken = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: { email: user.email, username: user.username, emailVerified: false },
  });
  setSessionCookie(response, sessionToken);
  return response;
}
