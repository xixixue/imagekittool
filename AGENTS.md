# AGENTS.md

Rules for AI agents and contributors working on ImageKitTools.

`ImageKitTools_SPEC.md` is the product requirements baseline. Read it before changing anything.

## Execution principles

1. Inspect the repository before planning; do not assume it is empty.
2. Develop strictly in Phase 0 → 5 order. Do not implement future-phase features early.
3. Do not change the four core design decisions (see below) without owner approval.
4. Do not integrate unapproved paid services, create real cloud resources, or fabricate keys,
   domains, or accounts.
5. At the end of every phase, run lint, typecheck, tests, and build — and report the results.
6. Before adding a dependency, state its purpose, bundle size, license, and maintenance status.
7. Do not introduce microservices, Kafka, Redis, Kubernetes, or other unnecessary infrastructure.
8. Local image processing must never upload images silently; cloud saves require explicit user action.
9. Every cloud-file API must verify user identity and file ownership.
10. Do not reuse an employer's private code, data, accounts, trademarks, or materials. This project
    does not implement CAD features.

## Four core design decisions (must not change)

1. **Local First** — images are processed in the browser by default; no server upload unless
   explicitly chosen and explained.
2. **Guest First** — core tools require no sign-up; no login wall blocks first use.
3. **Cloud Optional** — originals and results are saved to the cloud only on explicit user action;
   cloud files are private to their owner.
4. **Modular monolith + browser presigned uploads** — no microservices; object storage buckets are
   private; object keys are generated server-side.

## Contributor rules

- This SPEC is the product requirements baseline.
- Understand the repository structure before modifying it.
- Do not change the four core design decisions on your own.
- Images are processed locally by default; never upload without user authorization.
- Guest core functionality must not be blocked by a login wall.
- Cloud files must be saved only with explicit authorization.
- All cloud-file APIs verify user ownership.
- Object storage buckets must be private.
- Never commit secrets or `.env`.
- Keep business logic, UI, and the storage adapter separate.
- Image-processing algorithms must have tests.
- After every change, run lint, typecheck, tests, and build.
- New dependencies require a stated purpose, size, license, and maintenance status.
- Do not introduce unnecessary microservices or infrastructure.
- Do not integrate paid services or incur uncontrollable costs without confirmation.

## Phase reporting

At the end of each phase, report:

- Completed work
- Changed files
- Key implementation details
- Test commands and their results
- Outstanding items
- Risks and decisions that need the owner

## Configuration the owner must provide (do not fabricate)

- Production domain
- Database connection string
- Object storage account, bucket, and access keys
- Email service account and sending domain
- GA4 / Google Search Console / Sentry configuration
- Deployment platform and production environment variables

During development, use a local environment and a Mock Storage Adapter for features that do not
require real cloud services. Core local tools must run without any cloud configuration.
