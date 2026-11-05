import { NextResponse } from "next/server";
import { guardRateLimit } from "@/lib/auth/http";
import { createPasswordResetToken } from "@/lib/auth/verify-tokens";
import { prisma } from "@/lib/db/prisma";
import { getEmailSender } from "@/lib/email/email";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const RATE_LIMIT = 5; // 5 per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const blocked = guardRateLimit(request, "forgot-password", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = await createPasswordResetToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    await getEmailSender().send({
      to: email,
      subject: "Reset your ImageKitTools password",
      text: `Reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    });
  }

  // Always return ok to avoid account enumeration.
  return NextResponse.json({ ok: true });
}
