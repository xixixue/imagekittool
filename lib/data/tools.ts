/**
 * Canonical list of image tools.
 * Shared by the homepage, the tools directory, navigation and sitemap.
 * `status` is "planned" until a tool's route is implemented (Phase 1+).
 * `icon` and `accent` drive the per-tool visual identity on cards and headers.
 */
export type ToolStatus = "planned" | "active";

export type AccentKey = "amber" | "blue" | "rose" | "emerald" | "violet";
export type IconKey =
  | "compress"
  | "resize"
  | "convert"
  | "crop"
  | "target"
  | "image"
  | "rotate"
  | "watermark"
  | "meme"
  | "editor"
  | "blur";

export type Tool = {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  description: string;
  formats: string;
  status: ToolStatus;
  icon: IconKey;
  accent: AccentKey;
};

export const tools: Tool[] = [
  {
    slug: "image-compressor",
    href: "/image-compressor",
    name: "Image Compressor",
    tagline: "Shrink JPG, PNG, and WebP files",
    description:
      "Compress images with adjustable quality. Batch process and download individually or as a ZIP — all in your browser.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "compress",
    accent: "amber",
  },
  {
    slug: "image-resizer",
    href: "/image-resizer",
    name: "Image Resizer",
    tagline: "Resize by pixels, percent, or presets",
    description:
      "Change dimensions with aspect-ratio lock, percentage scaling, and common presets. Batch processing supported.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "resize",
    accent: "blue",
  },
  {
    slug: "image-converter",
    href: "/image-converter",
    name: "Image Converter",
    tagline: "Convert between JPG, PNG, and WebP",
    description:
      "Convert formats with correct background fill for transparency. The output extension always matches the real MIME type.",
    formats: "JPG ⇄ PNG ⇄ WebP",
    status: "active",
    icon: "convert",
    accent: "rose",
  },
  {
    slug: "image-cropper",
    href: "/image-cropper",
    name: "Image Cropper",
    tagline: "Crop with presets and rotation",
    description:
      "Crop with free or fixed aspect ratios (1:1, 4:3, 3:2, 16:9), 90° rotation, and touch support. Works on mobile.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "crop",
    accent: "emerald",
  },
  {
    slug: "compress-image-to-kb",
    href: "/compress-image-to-kb",
    name: "Compress Image to KB",
    tagline: "Hit an exact target file size",
    description:
      "Compress to a target size (50 KB, 100 KB, 200 KB, …) using a bounded quality search. Tells you honestly when a target isn't reachable.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "target",
    accent: "violet",
  },
  {
    slug: "rotate-image",
    href: "/rotate-image",
    name: "Rotate Image",
    tagline: "Rotate 90/180/270° and flip",
    description:
      "Rotate images by 90° steps and mirror horizontally or vertically. Batch process multiple files — all in your browser.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "rotate",
    accent: "blue",
  },
  {
    slug: "watermark-image",
    href: "/watermark-image",
    name: "Watermark Image",
    tagline: "Add text watermarks with position and opacity",
    description:
      "Stamp a text watermark on your images. Choose a 9-grid position, opacity, angle, or repeat it as a diagonal tile across the whole image.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "watermark",
    accent: "violet",
  },
  {
    slug: "meme-generator",
    href: "/meme-generator",
    name: "Meme Generator",
    tagline: "Add classic top and bottom text",
    description:
      "Turn any image into a meme with classic top and bottom text. Bold outlined lettering stays readable over any background.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "meme",
    accent: "rose",
  },
  {
    slug: "photo-editor",
    href: "/photo-editor",
    name: "Photo Editor",
    tagline: "Adjust, filter, add text and stickers",
    description:
      "Adjust brightness, contrast and saturation, apply filters, then drag text and emoji stickers onto your image with a live preview.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "editor",
    accent: "emerald",
  },
  {
    slug: "blur-image",
    href: "/blur-image",
    name: "Blur Image",
    tagline: "Manually blur or mosaic regions",
    description:
      "Draw rectangles over faces, plates or any sensitive area and blur or pixelate them. Everything runs locally — nothing is uploaded.",
    formats: "JPG · PNG · WebP",
    status: "active",
    icon: "blur",
    accent: "amber",
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
