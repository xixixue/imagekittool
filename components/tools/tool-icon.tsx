import type { SVGProps } from "react";
import type { AccentKey, IconKey } from "@/lib/data/tools";
import { cn } from "@/lib/utils";

/**
 * Per-tool visual identity: a gradient icon tile plus a matching line icon.
 * Icons are generic line-art (Lucide-style paths); nothing is copied from
 * third-party brands.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CompressIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function ResizeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

export function ConvertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function CropIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6 19h11.5z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function WatermarkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
      <path d="M9 13.5a3 3 0 0 0 3 3" />
    </svg>
  );
}

export function MemeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14.5s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9.5h.01" />
      <path d="M15 9.5h.01" />
    </svg>
  );
}

export function EditorIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

export function BlurIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="8" y="8" width="8" height="8" rx="1" strokeDasharray="3 2" />
    </svg>
  );
}

export function ExifIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
      <path d="M11 10v3" />
      <path d="M11 7.5h.01" />
    </svg>
  );
}

const ICONS: Record<IconKey, (props: IconProps) => React.ReactElement> = {
  compress: CompressIcon,
  resize: ResizeIcon,
  convert: ConvertIcon,
  crop: CropIcon,
  target: TargetIcon,
  image: ImageIcon,
  rotate: RotateIcon,
  watermark: WatermarkIcon,
  meme: MemeIcon,
  editor: EditorIcon,
  blur: BlurIcon,
  exif: ExifIcon,
};

// Literal class strings so Tailwind v4's scanner generates them.
const ACCENTS: Record<AccentKey, { grad: string; soft: string; text: string }> = {
  amber: { grad: "from-amber-400 to-orange-500", soft: "bg-amber-50", text: "text-amber-600" },
  blue: { grad: "from-sky-400 to-blue-600", soft: "bg-blue-50", text: "text-blue-600" },
  rose: { grad: "from-rose-400 to-pink-600", soft: "bg-rose-50", text: "text-rose-600" },
  emerald: {
    grad: "from-emerald-400 to-teal-600",
    soft: "bg-emerald-50",
    text: "text-emerald-600",
  },
  violet: { grad: "from-violet-500 to-purple-600", soft: "bg-violet-50", text: "text-violet-600" },
};

interface ToolIconProps {
  icon: IconKey;
  accent: AccentKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToolIcon({ icon, accent, size = "md", className }: ToolIconProps) {
  const Icon = ICONS[icon] ?? ImageIcon;
  const a = ACCENTS[accent] ?? ACCENTS.violet;
  const tile =
    size === "lg"
      ? "h-14 w-14 rounded-2xl"
      : size === "sm"
        ? "h-9 w-9 rounded-lg"
        : "h-11 w-11 rounded-xl";
  const glyph = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
        a.grad,
        tile,
        className,
      )}
    >
      <Icon className={glyph} />
    </div>
  );
}
