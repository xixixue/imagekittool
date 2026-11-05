// One-off R2 verification: loads .env, then exercises the S3 adapter contract
// server-side against the real bucket — presignPut → PUT bytes → head → delete →
// listKeys. No browser/CORS involved (server fetch). Safe: writes a single tiny
// test object and deletes it. Reads credentials from env only (no hardcoding).
import { readFileSync } from "node:fs";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Minimal .env loader (KEY="value" or KEY=value).
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const cfg = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "auto",
  bucket: process.env.S3_BUCKET,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
};
if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.endpoint) {
  console.error("FAIL: S3_* env vars missing in .env");
  process.exit(1);
}

const client = new S3Client({
  endpoint: cfg.endpoint,
  forcePathStyle: true,
  region: cfg.region,
  credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
});

const testKey = `_verify-${Date.now()}`;
const body = "r2-verify-ok\n";
const steps = [];
const pass = (m) => { steps.push(`✓ ${m}`); };
const fail = (m) => { steps.push(`✗ ${m}`); };

try {
  // 1. presignPut
  const putUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: cfg.bucket, Key: testKey, ContentType: "text/plain" }),
    { expiresIn: 60 },
  );
  pass(`presignPut -> signed URL (host=${new URL(putUrl).host})`);

  // 2. PUT bytes via fetch (server-side, no CORS)
  const putRes = await fetch(putUrl, {
    method: "PUT",
    body,
    headers: { "Content-Type": "text/plain" },
  });
  if (!putRes.ok) fail(`PUT failed: ${putRes.status} ${await putRes.text().catch(() => "")}`);
  else pass(`PUT ${body.length}B -> ${putRes.status}`);

  // 3. head — server verifies real object size (SPEC §7.3 step 8)
  const head = await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: testKey }));
  if (head.ContentLength === body.length) pass(`head -> size=${head.ContentLength} matches`);
  else fail(`head -> size=${head.ContentLength} expected ${body.length}`);

  // 4. presignGet + fetch content
  const getUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: cfg.bucket, Key: testKey }),
    { expiresIn: 60 },
  );
  const getRes = await fetch(getUrl);
  const got = await getRes.text();
  if (got === body) pass(`presignGet -> content matches`);
  else fail(`presignGet -> content mismatch: ${JSON.stringify(got)}`);

  // 5. delete (idempotent)
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: testKey }));
  pass(`delete -> ok`);

  // 6. head again -> must be NotFound/null
  try {
    await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: testKey }));
    fail(`head-after-delete -> object still present`);
  } catch (e) {
    if (e instanceof NotFound) pass(`head-after-delete -> NotFound (correct)`);
    else fail(`head-after-delete -> unexpected error: ${e.name}`);
  }

  // 7. listKeys works
  const list = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucket }));
  pass(`listKeys -> adapter callable (keys present: ${list.KeyCount ?? 0})`);
} catch (e) {
  fail(`exception: ${e.name}: ${e.message}`);
}

console.log(`\nR2 round-trip against bucket "${cfg.bucket}":`);
console.log(steps.join("\n"));
const ok = steps.every((s) => s.startsWith("✓"));
console.log(`\nRESULT: ${ok ? "PASS ✅" : "FAIL ❌"}`);
process.exit(ok ? 0 : 1);
