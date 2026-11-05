import { NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";

/** Best-effort client IP for per-IP rate limiting (single-instance dev). */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate-limit guard. Returns null when the request is allowed, or a 429 response
 * when the limit is exceeded. Used at the top of each auth route handler.
 */
export function guardRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${action}:${ip}`, limit, windowMs);
  if (result.ok) return null;
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
