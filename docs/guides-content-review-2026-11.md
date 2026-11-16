# Guides editorial and illustration review — 2026-11-16

## Scope and inventory

- The source registry in `lib/data/guides.ts` contains **19 guide entries**, not 20.
- The source had **7 guides without an inline body illustration**. Those seven now have a topic-specific illustration.
- No twentieth guide was invented; this review updates the 19 articles that actually exist in the project.

## Content changes

- Added a practical checklist or workflow section to all 19 guides.
- Corrected technical overstatements around lossy-compression quality percentages, PPI vs DPI, bit depth, invisible watermarks, blur/pixelation privacy, HEIC/JPEG conversion, and modern image-format compatibility.
- Aligned tool instructions with the actual implementations:
  - Compress to KB searches quality within a bounded search; it does not automatically resize image dimensions.
  - The PDF tool currently accepts JPG and PNG, one image per page, with A4/Letter, orientation, and margin settings; it does not provide OCR or a fit-to-original-page-size mode.
  - The favicon generator produces PNG sizes 16/32/48/96/180/192/512, a multi-size ICO, a manifest, and an HTML snippet.
  - EXIF removal re-encodes locally and parses the exported file again for remaining metadata.
  - The website optimizer exports WebP and optionally resizes to a chosen width; it does not create a responsive `srcset` package.
- Updated the YouTube thumbnail guide to current YouTube Help recommendations (3840×2160 for standard videos, 16:9; 2160×3840 for Shorts, 9:16; upload limits vary by device).
- Marked all articles with `updatedAt: 2026-11-16`, preserved their original `publishedAt`, displayed the update date, and emitted `dateModified` in Article JSON-LD.
- Added external reference links to relevant official or technical documentation (MDN, Google Search Central, YouTube Help, Apple Support, X Help, and LinkedIn Help).

## Illustration changes

- Created seven new, colorful 1200×675 vector illustrations for EXIF metadata removal, favicon sizes, 100 KB compression, image-to-PDF, YouTube thumbnails, responsive web images, and HEIC-to-JPG conversion.
- Replaced four weak or misleading illustrations:
  - Watermarking: removed claims that tiled or invisible watermarks are impossible to remove or prove ownership.
  - Blur vs pixelation: replaced the security comparison with a three-way visual showing blur, pixelation, and opaque redaction; the opaque method is recommended for sensitive data.
  - Compression artifacts: replaced a typo-heavy infographic with a clearer blocking/ringing comparison.
  - Quality levels: replaced a confusing checkerboard sample with a clearer high/medium/low visual comparison.
- Increased saturation, contrast, and brightness slightly across the guide WebP artwork to make the existing diagrams more vivid while retaining their content.
- Updated alt text and captions for the replacement illustrations.

## Remaining editorial follow-up

- The social-media preset registry and size-reference registry in `lib/data/social-presets.ts` and `lib/data/size-reference.ts` still carry `verifiedAt: 2025-01`. The social-media guide explicitly labels those dimensions as legacy starting points and links to current X and LinkedIn help pages. A separate project task should re-verify the full Instagram, Facebook, X, LinkedIn, and Pinterest preset registry before describing every value as current.
- The site should periodically review platform-specific dimensions because platform rules and upload surfaces change.

## Validation

- Verified 19 unique guide slugs.
- Verified every referenced guide image path exists and every guide now has at least one inline image.
- TypeScript transpilation/syntax checks passed for the changed guide data, renderer, JSON-LD builder, and guide page.
- A full `tsc --noEmit`, app build, and Vitest run could not be completed in this environment because project dependencies (`next`, React types, etc.) are not installed and package-registry access is unavailable. Install dependencies locally and run `pnpm typecheck`, `pnpm test`, and `pnpm build` before deployment.
