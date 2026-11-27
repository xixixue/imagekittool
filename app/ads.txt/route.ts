import { NextResponse } from "next/server";
import { ADSENSE_CLIENT } from "@/lib/config/site";

/**
 * ads.txt — authorizes Google AdSense as a seller of the site's ad inventory
 * (AdSense reviewer requirement: https://imagekittool.com/ads.txt must return the
 * correct record once configured).
 *
 * The publisher client ID (ca-pub-…) comes from lib/config/site (owner-provided
 * production default, env-overridable). The "ca-" prefix is stripped to produce
 * the ads.txt publisher ID. When the ID is empty (development, or explicitly
 * disabled) the route returns 404 — the site never ships a fabricated or
 * placeholder publisher ID.
 *
 * Record format:
 *   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
 * Ref: https://support.google.com/adsense/answer/12171612
 */
export function GET() {
  const match = ADSENSE_CLIENT.match(/^ca-(pub-\d+)$/);
  if (!match) {
    // No publisher ID configured: honest 404, not a fake ID.
    return new NextResponse("ads.txt not configured", { status: 404 });
  }
  const publisherId = match[1];
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
