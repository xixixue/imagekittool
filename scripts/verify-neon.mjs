// Verify the app's Prisma Client connects to Neon and all tables exist.
// Reads DATABASE_URL from .env. Counts rows per table (fresh DB -> expect 0s).
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const prisma = new PrismaClient();
const tables = ["user", "session", "token", "storageFile", "uploadTask", "userStorageQuota"];
const out = [];
let ok = true;
try {
  for (const t of tables) {
    const c = await prisma[t].count();
    out.push(`✓ ${t}: ${c} rows`);
  }
} catch (e) {
  ok = false;
  out.push(`✗ error: ${e.name}: ${e.message}`);
} finally {
  await prisma.$disconnect();
}
console.log("Neon connection + schema check:");
console.log(out.join("\n"));
console.log(`\nRESULT: ${ok ? "PASS ✅" : "FAIL ❌"}`);
process.exit(ok ? 0 : 1);
