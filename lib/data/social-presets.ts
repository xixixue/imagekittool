/**
 * Social media size presets (SPEC V2 §7, Phase 4).
 *
 * Central, data-driven preset registry — NOT hardcoded in UI components
 * (§7: '预设尺寸集中管理，不能散落硬编码在 UI'). Components consume this
 * module; size changes update this file only.
 *
 * IMPORTANT (§7 '尺寸数据治理'): these are commonly RECOMMENDED values, not
 * platform-enforced rules. Each preset carries a verifiedAt date; the UI must
 * distinguish recommendations from hard limits and must not describe unverified
 * sizes as official platform specs.
 */

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "pinterest"
  | "linkedin";

export type SocialScene =
  | "post"
  | "story"
  | "reel-cover"
  | "thumbnail"
  | "profile"
  | "banner"
  | "cover"
  | "pin";

export interface SocialPreset {
  id: string;
  platform: SocialPlatform;
  scene: SocialScene;
  /** Display name, e.g. "Instagram Post". */
  name: string;
  width: number;
  height: number;
  /** Aspect ratio label, e.g. "1:1" or "9:16". */
  ratio: string;
  /** Recommended usage note (NOT an enforced platform rule). */
  description: string;
  /** ISO date this size was last reviewed (YYYY-MM). */
  verifiedAt: string;
  enabled: boolean;
}

export const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "youtube",
  "pinterest",
  "linkedin",
];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

/**
 * Curated recommended sizes. Reviewed 2025-01 against each platform's published
 * creator/help docs. Treat as recommendations, not enforced limits.
 */
export const SOCIAL_PRESETS: SocialPreset[] = [
  // Instagram
  { id: "ig-post", platform: "instagram", scene: "post", name: "Instagram Post", width: 1080, height: 1080, ratio: "1:1", description: "Square feed post. Recommended minimum.", verifiedAt: "2025-01", enabled: true },
  { id: "ig-story", platform: "instagram", scene: "story", name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16", description: "Vertical story / reel cover.", verifiedAt: "2025-01", enabled: true },
  { id: "ig-reel-cover", platform: "instagram", scene: "reel-cover", name: "Instagram Reel Cover", width: 1080, height: 1920, ratio: "9:16", description: "Vertical cover for reels.", verifiedAt: "2025-01", enabled: true },
  { id: "ig-profile", platform: "instagram", scene: "profile", name: "Instagram Profile", width: 320, height: 320, ratio: "1:1", description: "Profile picture (displayed small).", verifiedAt: "2025-01", enabled: true },
  // Facebook
  { id: "fb-post", platform: "facebook", scene: "post", name: "Facebook Post", width: 1200, height: 630, ratio: "1.91:1", description: "Link/image share preview.", verifiedAt: "2025-01", enabled: true },
  { id: "fb-cover", platform: "facebook", scene: "cover", name: "Facebook Cover", width: 820, height: 312, ratio: "2.62:1", description: "Page cover (displays cropped on mobile).", verifiedAt: "2025-01", enabled: true },
  { id: "fb-profile", platform: "facebook", scene: "profile", name: "Facebook Profile", width: 170, height: 170, ratio: "1:1", description: "Profile picture.", verifiedAt: "2025-01", enabled: true },
  // YouTube
  { id: "yt-thumbnail", platform: "youtube", scene: "thumbnail", name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9", description: "Video thumbnail.", verifiedAt: "2025-01", enabled: true },
  { id: "yt-banner", platform: "youtube", scene: "banner", name: "YouTube Banner", width: 2560, height: 1440, ratio: "16:9", description: "Channel art (safe area varies).", verifiedAt: "2025-01", enabled: true },
  { id: "yt-profile", platform: "youtube", scene: "profile", name: "YouTube Profile", width: 800, height: 800, ratio: "1:1", description: "Channel icon.", verifiedAt: "2025-01", enabled: true },
  // Pinterest
  { id: "pin-pin", platform: "pinterest", scene: "pin", name: "Pinterest Pin", width: 1000, height: 1500, ratio: "2:3", description: "Standard pin (vertical).", verifiedAt: "2025-01", enabled: true },
  { id: "pin-profile", platform: "pinterest", scene: "profile", name: "Pinterest Profile", width: 165, height: 165, ratio: "1:1", description: "Profile picture.", verifiedAt: "2025-01", enabled: true },
  // LinkedIn
  { id: "li-post", platform: "linkedin", scene: "post", name: "LinkedIn Post", width: 1200, height: 627, ratio: "1.91:1", description: "Shared image / link preview.", verifiedAt: "2025-01", enabled: true },
  { id: "li-cover", platform: "linkedin", scene: "cover", name: "LinkedIn Cover", width: 1584, height: 396, ratio: "4:1", description: "Profile background banner.", verifiedAt: "2025-01", enabled: true },
  { id: "li-profile", platform: "linkedin", scene: "profile", name: "LinkedIn Profile", width: 400, height: 400, ratio: "1:1", description: "Profile picture.", verifiedAt: "2025-01", enabled: true },
];

/** All enabled presets for a platform, in registry order. */
export function presetsByPlatform(platform: SocialPlatform): SocialPreset[] {
  return SOCIAL_PRESETS.filter((p) => p.platform === platform && p.enabled);
}

/** All enabled presets for a scene across platforms. */
export function presetsByScene(scene: SocialScene): SocialPreset[] {
  return SOCIAL_PRESETS.filter((p) => p.scene === scene && p.enabled);
}

/** Look up a single preset by id (enabled or not). */
export function getPreset(id: string): SocialPreset | undefined {
  return SOCIAL_PRESETS.find((p) => p.id === id);
}
