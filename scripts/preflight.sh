#!/usr/bin/env bash
# Pre-push self-check: ensure no secrets, personal info, or local artifacts get
# pushed to GitHub. Run before `git push`:  bash scripts/preflight.sh
# Scans the STAGED diff + tracked status only (does not modify anything).
# Detection uses GENERIC patterns — no real secrets are hardcoded in this file.
set -uo pipefail

echo "=== preflight: secret & local-artifact leak check ==="
bad=0

# 1. Sensitive/local files must never be tracked or staged.
for f in .env .env.vercel .env.local dev.db prisma/dev.db .cloud-storage .next node_modules; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "  ✗ TRACKED secret/local file: $f"; bad=1
  fi
done

# 2. No real .env* file staged. .env.example is the committed template (empty
#    values only) and is allowed; everything else (.env, .env.local, .env.vercel,
#    .env.production, …) must never be staged.
staged_env=$(git diff --cached --name-only 2>/dev/null | grep -E '^\.env' | grep -vE '^\.env\.example$' || true)
if [ -n "$staged_env" ]; then
  echo "  ✗ a real .env* file is staged (only .env.example may be committed):"; echo "$staged_env" | sed 's/^/      /'; bad=1
fi

# 3. Staged diff must not contain secret / personal-info PATTERNS (generic, not literal secrets):
#    - Neon password prefix  npg_<16+ alnum>
#    - Resend key prefix     re_<20+ alnum/_>
#    - 64-char hex string    (R2 secret keys etc.)
#    - personal QQ/163 email <6+ digits>@qq.com / @163.com
PAT='npg_[A-Za-z0-9]{16,}|re_[A-Za-z0-9_]{20,}|[0-9a-f]{64}|[0-9]{6,}@(qq|163)\.com'
staged_secrets=$(git diff --cached -U0 2>/dev/null | grep -E "$PAT" | grep -vE '^\+.*PAT=' || true)
if [ -n "$staged_secrets" ]; then
  echo "  ✗ staged diff contains a secret/personal-info pattern:"; echo "$staged_secrets" | sed 's/^/      /'; bad=1
fi

# 4. .env / .env.vercel must be gitignored.
for f in .env .env.vercel; do
  if [ -e "$f" ] && ! git check-ignore -q "$f"; then
    echo "  ✗ $f exists but is NOT gitignored!"; bad=1
  fi
done

if [ "$bad" = "0" ]; then
  echo "  ✓ no secrets / personal info / local artifacts staged or tracked"
  echo "  ✓ .env files gitignored"
  echo "=== preflight OK — safe to push ==="
  exit 0
else
  echo "=== preflight FAILED — fix the above before pushing ==="
  exit 1
fi
