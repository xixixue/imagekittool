/**
 * Image Size Reference (SPEC V2 §8.4, Phase 5).
 *
 * A searchable, centrally-managed size reference across six categories. Each
 * entry carries 用途名称/推荐宽高/宽高比/推荐格式/说明/最后核验日期/对应 Resizer
 * 入口. Data is maintainable here — NOT hardcoded in article body (§8.4).
 *
 * The Social category is derived from lib/data/social-presets.ts (single source
 * of truth for social sizes) so the Social Media Resizer and this reference
 * never drift. Other categories are curated here.
 *
 * §7 governance still applies: these are recommended values, reviewed and
 * dated — not enforced specs.
 */
import {
  SOCIAL_PRESETS,
  type SocialPreset,
} from "./social-presets";

export type SizeCategory =
  | "social"
  | "website"
  | "email"
  | "video-thumbnail"
  | "profile"
  | "print";

export interface SizeEntry {
  id: string;
  category: SizeCategory;
  name: string;
  width: number;
  height: number;
  ratio: string;
  /** Recommended formats, e.g. "JPG, PNG, WebP". */
  formats: string;
  description: string;
  /** ISO review date (YYYY-MM). */
  verifiedAt: string;
  /** Tool route that can produce this size (the '对应 Resizer 入口', §8.4). */
  resizerHref: string;
}

export const SIZE_CATEGORIES: SizeCategory[] = [
  "social",
  "website",
  "email",
  "video-thumbnail",
  "profile",
  "print",
];

export const CATEGORY_LABELS: Record<SizeCategory, string> = {
  social: "Social Media",
  website: "Website",
  email: "Email",
  "video-thumbnail": "Video Thumbnail",
  profile: "Profile / Avatar",
  print: "Print",
};

/** Social entries derived from the social-presets registry (no duplication). */
const socialEntries: SizeEntry[] = SOCIAL_PRESETS.map((p: SocialPreset) => ({
  id: `size-${p.id}`,
  category: "social",
  name: p.name,
  width: p.width,
  height: p.height,
  ratio: p.ratio,
  formats: "JPG, PNG, WebP",
  description: p.description,
  verifiedAt: p.verifiedAt,
  resizerHref: "/social-media-resizer",
}));

/**
 * Curated recommended sizes for the other five categories. Reviewed 2025-01.
 * Treat as recommendations, not enforced limits.
 */
const otherEntries: SizeEntry[] = [
  // Website
  { id: "web-og", category: "website", name: "Open Graph (Social Share)", width: 1200, height: 630, ratio: "1.91:1", formats: "JPG, PNG, WebP", description: "Link preview image for social share and messaging.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "web-hero", category: "website", name: "Website Hero Banner", width: 1920, height: 1080, ratio: "16:9", formats: "WebP, JPG", description: "Full-width hero / cover banner.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "web-favicon", category: "website", name: "Favicon (32px)", width: 32, height: 32, ratio: "1:1", formats: "PNG, ICO", description: "Browser tab favicon (also generate 16/48).", verifiedAt: "2025-01", resizerHref: "/favicon-generator" },
  { id: "web-apple-touch", category: "website", name: "Apple Touch Icon", width: 180, height: 180, ratio: "1:1", formats: "PNG", description: "iOS home-screen icon.", verifiedAt: "2025-01", resizerHref: "/favicon-generator" },
  // Email
  { id: "email-header", category: "email", name: "Email Header", width: 600, height: 200, ratio: "3:1", formats: "JPG, PNG", description: "Common email header width (600px column).", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "email-banner", category: "email", name: "Email Full-Width Image", width: 600, height: 300, ratio: "2:1", formats: "JPG, PNG", description: "Full-width image inside a 600px email column.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  // Video Thumbnail
  { id: "vid-thumb", category: "video-thumbnail", name: "Video Thumbnail (16:9)", width: 1280, height: 720, ratio: "16:9", formats: "JPG, WebP", description: "Standard HD video thumbnail.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "vid-cover", category: "video-thumbnail", name: "Video Cover (Full HD)", width: 1920, height: 1080, ratio: "16:9", formats: "JPG, WebP", description: "Full HD video cover image.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  // Profile / Avatar
  { id: "avatar-128", category: "profile", name: "Avatar (128px)", width: 128, height: 128, ratio: "1:1", formats: "PNG, WebP", description: "Small avatar / comment icon.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "avatar-256", category: "profile", name: "Avatar (256px)", width: 256, height: 256, ratio: "1:1", formats: "PNG, WebP", description: "Medium avatar.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  { id: "avatar-512", category: "profile", name: "Avatar (512px)", width: 512, height: 512, ratio: "1:1", formats: "PNG, WebP", description: "Large avatar / app icon source.", verifiedAt: "2025-01", resizerHref: "/resize-image" },
  // Print (at 300 DPI)
  { id: "print-4x6", category: "print", name: "4×6 in Print (300 DPI)", width: 1200, height: 1800, ratio: "2:3", formats: "JPG, PNG, TIFF", description: "Standard photo print at 300 DPI.", verifiedAt: "2025-01", resizerHref: "/dpi-changer" },
  { id: "print-5x7", category: "print", name: "5×7 in Print (300 DPI)", width: 1500, height: 2100, ratio: "5:7", formats: "JPG, PNG, TIFF", description: "Photo print at 300 DPI.", verifiedAt: "2025-01", resizerHref: "/dpi-changer" },
  { id: "print-8x10", category: "print", name: "8×10 in Print (300 DPI)", width: 2400, height: 3000, ratio: "4:5", formats: "JPG, PNG, TIFF", description: "Framed photo print at 300 DPI.", verifiedAt: "2025-01", resizerHref: "/dpi-changer" },
  { id: "print-a4", category: "print", name: "A4 at 300 DPI", width: 2480, height: 3508, ratio: "1:1.41", formats: "JPG, PNG, TIFF", description: "A4 page at 300 DPI (210×297mm).", verifiedAt: "2025-01", resizerHref: "/dpi-changer" },
];

export const SIZE_ENTRIES: SizeEntry[] = [...socialEntries, ...otherEntries];

/** All entries in a category, in registry order. */
export function entriesByCategory(category: SizeCategory): SizeEntry[] {
  return SIZE_ENTRIES.filter((e) => e.category === category);
}

/** Case-insensitive search across name/description/ratio. */
export function searchEntries(query: string): SizeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SIZE_ENTRIES;
  return SIZE_ENTRIES.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.ratio.toLowerCase().includes(q) ||
      CATEGORY_LABELS[e.category].toLowerCase().includes(q),
  );
}
