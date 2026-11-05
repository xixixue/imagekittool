import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/** Returns the currently signed-in user, or null. Used by the client header. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
