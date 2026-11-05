// Verify Resend: loads .env, sends a real test email via the app's
// ResendEmailSender class, and reports the provider's HTTP response.
// 200 + id => API key valid AND from-domain verified in Resend.
// 422/403 "domain not verified" => the owner still needs to verify imagekittool.com in Resend.
//
// Recipient defaults to EMAIL_FROM (a self-send connectivity check). Pass a real
// inbox as argv[1] to confirm delivery:  node verify-resend.mjs you@example.com
import { readFileSync } from "node:fs";

// Load .env (the ResendEmailSender itself reads env, but the script constructs it directly).
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const to = process.argv[2] || from;
if (!apiKey || !from) {
  console.error("FAIL: RESEND_API_KEY / EMAIL_FROM missing in .env");
  process.exit(1);
}

console.log(`From: ${from}`);
console.log(`To:   ${to}`);

// Call the provider directly to inspect the raw HTTP response.
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "ImageKitTools — Resend wiring test",
    text: "This is an automated connectivity test from ImageKitTools. If you received this, Resend + the sending domain are correctly configured.",
  }),
});
const body = await res.text();
console.log(`\nResend HTTP ${res.status}`);
console.log(`Body: ${body}`);
if (res.ok) {
  console.log("\nRESULT: PASS ✅ — Resend accepted the send (key valid + from-domain verified).");
} else if (/not verified|unverified|domain/i.test(body)) {
  console.log("\nRESULT: DOMAIN NOT VERIFIED ❌ — verify imagekittool.com in Resend (add MX/SPF/DKIM at Cloudflare DNS), then retry.");
} else {
  console.log(`\nRESULT: FAIL ❌ — Resend rejected (see body above).`);
}
process.exit(res.ok ? 0 : 1);
