/**
 * Tool SEO content (SPEC §13).
 *
 * The translatable copy — how-to steps, use cases, format/size knowledge, and
 * FAQ — lives in the i18n message catalog under the `ToolSeo` namespace (see
 * `messages/<locale>.json`) so every supported locale can render it. This file
 * holds only the non-translatable structure: the TypeScript shape of a tool's
 * SEO block, and the per-tool list of *related tool slugs* (rendered as
 * internal links whose display names come from the existing `Tool` namespace).
 */

/** Shape of one tool's SEO block inside the `ToolSeo` message namespace. */
export interface ToolSeoData {
  steps: string[];
  useCases: string[];
  knowledge: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
}

/**
 * Related tools per slug. Slugs only — never user-facing copy — so this map
 * does not need translation. The linked tool's localized name is resolved from
 * the `Tool` namespace at render time.
 */
export const TOOL_SEO_RELATED: Record<string, string[]> = {
  "image-compressor": ["image-resizer", "compress-image-to-kb", "image-converter"],
  "image-resizer": ["image-compressor", "image-cropper", "image-converter"],
  "image-converter": ["image-compressor", "image-resizer", "compress-image-to-kb"],
  "image-cropper": ["image-resizer", "rotate-image", "photo-editor"],
  "compress-image-to-kb": ["image-compressor", "image-converter", "image-resizer"],
  "rotate-image": ["image-cropper", "image-resizer", "watermark-image"],
  "watermark-image": ["photo-editor", "image-compressor", "image-converter"],
  "meme-generator": ["photo-editor", "watermark-image", "image-cropper"],
  "photo-editor": ["watermark-image", "meme-generator", "image-cropper"],
  "blur-image": ["photo-editor", "image-cropper", "image-compressor"],
};
