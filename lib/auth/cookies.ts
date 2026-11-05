import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_LIFETIME_MS } from "./tokens";

/**
 * Session cookie helpers. HttpOnly, SameSite=Lax, Secure in production, scoped
 * to path "/". The raw token lives only in the cookie; the DB stores its hash.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_LIFETIME_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
