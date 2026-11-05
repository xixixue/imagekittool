// Full end-to-end closed loop against the running dev server (R2 + Neon + Resend wired).
// Register -> (Resend sends verification email to the real inbox) -> verify-email ->
// login -> save a real PNG to R2 via presigned PUT -> list -> download -> delete ->
// quota before/after. Cleans up the test user (cascade) in finally.
//
// The verification email is delivered to the recipient inbox by Resend; this script
// completes verification by reading the token from Neon and calling the verify API.
// Confirm actual inbox receipt separately (check QQ inbox / spam).
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Test account credentials come from argv/env — never hardcoded (no personal
// emails or passwords in the repo). Usage: node verify-e2e.mjs <email> <password>
const EMAIL = process.argv[2] || process.env.E2E_EMAIL;
const PASSWORD = process.argv[3] || process.env.E2E_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Usage: node verify-e2e.mjs <email> <password>\n   (or set E2E_EMAIL / E2E_PASSWORD)");
  process.exit(1);
}
const prisma = new PrismaClient();
const steps = [];
const pass = (m) => steps.push(`✓ ${m}`);
const fail = (m) => steps.push(`✗ ${m}`);

// Real 1x1 PNG (a "processed result" the browser would save to cloud).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

let sessionCookie = "";
const jar = () => (sessionCookie ? { Cookie: `session=${sessionCookie}` } : {});
const grabCookie = (res) => {
  const sc = res.headers.get("set-cookie") || "";
  const m = sc.match(/session=([^;]+)/);
  if (m) sessionCookie = m[1];
};
const j = (r) => r.headers.get("content-type")?.includes("json") ? r.json() : r.text();

try {
  // 1. Register (triggers Resend verification email to the QQ inbox)
  let r = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "E2E Test" }),
  });
  if (r.ok) pass(`register -> ${r.status} (verification email sent to ${EMAIL} via Resend)`);
  else fail(`register -> ${r.status} ${await r.text()}`);
  grabCookie(r);

  // 2. Confirm user in Neon
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error("user not in Neon after register");
  pass(`Neon user created (id ${user.id.slice(0, 8)}…, verified=${!!user.emailVerifiedAt})`);

  // 3. Mint a REAL raw verification token via the app's own algorithm.
  //    Tokens are stored SHA-256 hashed in the DB; the raw token lives only in
  //    the email link (which Resend delivered to the inbox). We mint one directly
  //    to exercise the verify endpoint with a valid raw token — equivalent to the
  //    user clicking the link in the email.
  const rawToken = randomBytes(32).toString("base64url");
  await prisma.token.create({
    data: {
      token: createHash("sha256").update(rawToken).digest("hex"),
      userId: user.id,
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  pass(`minted real verification token (raw ${rawToken.slice(0, 6)}…) in Neon`);

  // 4. Verify email (consume raw token -> set emailVerifiedAt)
  r = await fetch(`${BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: rawToken }),
  });
  if (r.ok) pass(`verify-email -> ${r.status}`);
  else fail(`verify-email -> ${r.status} ${await r.text()}`);
  const u2 = await prisma.user.findUnique({ where: { email: EMAIL }, select: { emailVerifiedAt: true } });
  if (u2?.emailVerifiedAt) pass("emailVerifiedAt set in Neon");
  else fail("emailVerifiedAt NOT set");

  // 4. Login
  r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (r.ok) pass(`login -> ${r.status}`);
  else fail(`login -> ${r.status} ${await r.text()}`);
  grabCookie(r);

  // 5. Quota before
  r = await fetch(`${BASE}/api/cloud/storage/usage`, { headers: jar() });
  const before = await j(r);
  pass(`quota before: used=${before.usedBytes} reserved=${before.reservedBytes} quota=${before.quotaBytes}`);

  // 6. Create upload task (presigned PUT URL)
  r = await fetch(`${BASE}/api/cloud/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...jar() },
    body: JSON.stringify({ fileName: "e2e-test.png", mimeType: "image/png", sizeBytes: PNG.length, category: "PROCESSED" }),
  });
  if (!r.ok) throw new Error(`uploads ${r.status} ${await r.text()}`);
  const handle = await j(r);
  pass(`uploads -> uploadId ${String(handle.uploadId).slice(0, 8)}…`);

  // 7. Browser-direct PUT to R2 presigned URL (server-side fetch, no CORS)
  const put = await fetch(handle.uploadUrl, { method: "PUT", body: PNG, headers: handle.headers });
  if (put.ok) pass(`PUT ${PNG.length}B to R2 -> ${put.status}`);
  else fail(`PUT to R2 -> ${put.status} ${await put.text()}`);

  // 8. Confirm upload (server heads R2 object, verifies real size)
  r = await fetch(`${BASE}/api/cloud/uploads/${handle.uploadId}/complete`, { method: "POST", headers: jar() });
  if (!r.ok) throw new Error(`complete ${r.status} ${await r.text()}`);
  const compl = await j(r);
  const fileId = compl.fileId;
  pass(`complete -> fileId ${String(fileId).slice(0, 8)}… (R2 object verified by server)`);

  // 9. List files (ownership-scoped)
  r = await fetch(`${BASE}/api/cloud/files`, { headers: jar() });
  const { files } = await j(r);
  if (files.some((f) => f.id === fileId)) pass(`files list -> contains new file (${files.length} total)`);
  else fail("files list -> new file missing");

  // 10. Quota after upload
  r = await fetch(`${BASE}/api/cloud/storage/usage`, { headers: jar() });
  const after = await j(r);
  if (after.usedBytes === before.usedBytes + PNG.length)
    pass(`quota +${PNG.length}B (used ${before.usedBytes} -> ${after.usedBytes})`);
  else fail(`quota mismatch: ${before.usedBytes} -> ${after.usedBytes} (expected +${PNG.length})`);

  // 11. Download via presigned GET URL + verify content integrity
  r = await fetch(`${BASE}/api/cloud/files/${fileId}/download-url`, { method: "POST", headers: jar() });
  if (!r.ok) throw new Error(`download-url ${r.status}`);
  const { url } = await j(r);
  const dl = await fetch(url);
  const dlBody = Buffer.from(await dl.arrayBuffer());
  if (dlBody.equals(PNG)) pass(`download -> content matches (${dlBody.length}B)`);
  else fail(`download -> content mismatch (${dlBody.length} vs ${PNG.length})`);

  // 12. Delete (R2 object + DB row + quota release)
  r = await fetch(`${BASE}/api/cloud/files/${fileId}`, { method: "DELETE", headers: jar() });
  if (r.ok) pass(`delete -> ${r.status}`);
  else fail(`delete -> ${r.status} ${await r.text()}`);

  // 13. Quota restored
  r = await fetch(`${BASE}/api/cloud/storage/usage`, { headers: jar() });
  const final = await j(r);
  if (final.usedBytes === before.usedBytes) pass(`quota restored (used ${final.usedBytes})`);
  else fail(`quota not restored: ${final.usedBytes}`);

  // 14. Files list empty again
  r = await fetch(`${BASE}/api/cloud/files`, { headers: jar() });
  const { files: files2 } = await j(r);
  if (files2.length === 0) pass("files list -> empty after delete");
  else fail(`files list -> ${files2.length} remaining`);
} catch (e) {
  fail(`exception: ${e.message}`);
} finally {
  try {
    const d = await prisma.user.deleteMany({ where: { email: EMAIL } });
    if (d.count > 0) steps.push(`✓ cleanup: deleted ${d.count} test user (cascade) — Neon clean`);
  } catch (e) {
    steps.push(`✗ cleanup error: ${e.message}`);
  }
  await prisma.$disconnect();
}

console.log(steps.join("\n"));
const ok = steps.every((s) => s.startsWith("✓"));
console.log(`\nRESULT: ${ok ? "PASS ✅" : "FAIL ❌"}`);
process.exit(ok ? 0 : 1);
