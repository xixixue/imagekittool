import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./session";

/**
 * Guard for protected APIs (e.g. cloud storage, Phase 3+).
 * Returns the authenticated user, or a 401 response when not signed in.
 *
 * Usage in a route handler:
 *   const auth = await requireUser();
 *   if ("response" in auth) return auth.response;
 *   auth.user; // SessionUser
 */
export async function requireUser(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { user };
}
