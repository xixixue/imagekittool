import { NextResponse } from "next/server";

/**
 * ads.txt — authorizes Google AdSense as a seller of the site's ad inventory
 * (AdSense reviewer requirement: https://imagekittool.com/ads.txt must return the
 * correct record once configured).
 *
 * Driven by NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-XXXXXXXXXXXXXXXX). The "ca-" prefix
 * is stripped to produce the ads.txt publisher ID. When the env var is unset the
 * route returns 404 — the site never ships a fabricated or placeholder publisher
 * ID (AGENTS.md: do not fabricate keys, domains, or accounts).
 *
 * Record format:
 *   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
 * Ref: https://support.google.com/adsense/answer/12171612
 */
export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
  const match = client.match(/^ca-(pub-\d+)$/);
  if (!match) {
    // Pre-configuration / development: no ads.txt yet (honest 404, not a fake ID).
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
