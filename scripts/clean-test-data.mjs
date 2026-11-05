// Remove test users (email ending in @example.com) from the Neon DB so the
// production database stays clean after local verification. Cascade deletes
// their sessions/tokens/storage rows. Reads DATABASE_URL from .env.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const prisma = new PrismaClient();
try {
  const deleted = await prisma.user.deleteMany({ where: { email: { endsWith: "@example.com" } } });
  console.log(`Deleted ${deleted.count} test user(s) (cascaded sessions/tokens).`);
} catch (e) {
  console.error(`cleanup error: ${e.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
