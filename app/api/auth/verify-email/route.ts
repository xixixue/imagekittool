import { NextResponse } from "next/server";
import { guardRateLimit } from "@/lib/auth/http";
import { consumeToken } from "@/lib/auth/verify-tokens";
import { prisma } from "@/lib/db/prisma";

const RATE_LIMIT = 10; // 10 per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const blocked = guardRateLimit(request, "verify-email", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token =
    typeof (body as { token?: unknown })?.token === "string"
      ? (body as { token: string }).token
      : "";
  const userId = await consumeToken(token, "email_verification");
  if (!userId) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 },
    );
  }

  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
