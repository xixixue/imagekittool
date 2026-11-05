# ImageKitTools

A privacy-first online image toolkit. Every core tool runs **in your browser**, so images are not
uploaded to a server by default. Signed-in users can optionally save originals and results to a
private cloud space.

This repository is the development baseline described in `ImageKitTools_SPEC.md`.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** v4 + **shadcn/ui** style components
- **pnpm** as the package manager
- **Prisma** + **PostgreSQL** (Phase 2+)
- **S3-compatible** object storage with browser presigned uploads (Phase 3)

## Getting started

```bash
pnpm install        # install dependencies
cp .env.example .env  # then edit .env (local tools work without cloud vars)
pnpm dev            # start the dev server at http://localhost:3000
```

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start the Next.js dev server      |
| `pnpm build`        | Production build                  |
| `pnpm start`        | Run the production build          |
| `pnpm lint`         | Run ESLint                        |
| `pnpm typecheck`    | Run `tsc --noEmit`                |
| `pnpm format`       | Format the codebase with Prettier |
| `pnpm format:check` | Check formatting without writing  |

## Project structure

```
app/            Next.js App Router pages, layouts, metadata, sitemap, robots
components/     UI components (layout, tools, upload, cloud, ui)
features/       Domain logic (image-processing, auth, cloud-storage, quota, history)
lib/            Shared utilities (auth, db, storage, validation, config, data)
prisma/         Prisma schema and migrations
public/         Static assets
tests/          Automated tests
docs/           Project documentation
```

## Core design decisions (do not change without owner approval)

1. **Local First** — images are processed in the browser by default; no upload unless explicitly chosen.
2. **Guest First** — core tools need no sign-up; no login wall on first visit.
3. **Cloud Optional** — originals and results are saved to the cloud only on explicit user action.
4. **Modular monolith + browser presigned uploads** — no microservices; the backend only handles
   auth, metadata, quota, and upload/download authorization.

See `ImageKitTools_SPEC.md` and `AGENTS.md` for the full requirements and contributor rules.

## Development phases

- **Phase 0** — project skeleton, layout, navigation, SEO basics ✅ (this baseline)
- Phase 1 — guest local tools (5 P0 tools, batch, ZIP, download)
- Phase 2 — user system (register, login, email verification, password reset)
- Phase 3 — personal cloud space (quota, presigned uploads, file management)
- Phase 4 — SEO content and launch readiness
- Phase 5 — growth (history, more tools)

## Notes

- `pnpm` is configured (via `.npmrc`) to keep its store and cache inside the workspace
  (`.pnpm-store`, `.pnpm-cache`). Both are gitignored. This keeps the project self-contained in
  sandboxed environments; remove `.npmrc` if you prefer the global pnpm store.
- External services (database, object storage, email, analytics, domain) are **not** configured in
  this baseline. Provide real values in `.env` during the relevant phase; do not fabricate them.
