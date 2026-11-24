"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { tools } from "@/lib/data/tools";

/**
 * Categorized "Tools" mega-menu for the primary navigation (AdSense reviewer
 * feedback: "按功能划分的可点击分类菜单"). Each category and each tool is a
 * real, independently-routable link — no JS-only navigation, no dead ends.
 *
 * Behaviour:
 * - Desktop: opens on hover and on focus.
 * - Touch/mobile: opens on click; closes on outside click or Escape.
 * - The trigger itself links to /tools so keyboard/Tap users always reach the
 *   full tool directory.
 */
const CATEGORIES: { key: "compress" | "resizeCrop" | "convert" | "edit"; slugs: string[] }[] = [
  {
    key: "compress",
    slugs: ["image-compressor", "compress-image-to-kb", "optimize-website"],
  },
  {
    key: "resizeCrop",
    slugs: ["image-resizer", "image-cropper", "social-media-resizer", "dpi-changer"],
  },
  {
    key: "convert",
    slugs: ["image-converter", "heic-to-jpg", "image-to-pdf", "pdf-to-image"],
  },
  {
    key: "edit",
    slugs: [
      "photo-editor",
      "rotate-image",
      "watermark-image",
      "meme-generator",
      "blur-image",
      "exif-viewer",
      "exif-remover",
      "favicon-generator",
      "batch-workspace",
    ],
  },
];

const toolMap = new Map(tools.map((t) => [t.slug, t]));

export function ToolsMenu() {
  const t = useTranslations("Nav");
  const toolT = useTranslations("Tool");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
    >
      <Link
        href="/tools"
        onFocus={() => setOpen(true)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {t("tools")}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Link>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-[34rem] max-w-[92vw] rounded-xl border border-border bg-popover p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("tools")}
            </span>
            <Link
              href="/tools"
              onClick={close}
              role="menuitem"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("allTools")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(cat.key)}
                </p>
                <ul className="space-y-1">
                  {cat.slugs.map((slug) => {
                    const tool = toolMap.get(slug);
                    if (!tool) return null;
                    return (
                      <li key={slug}>
                        <Link
                          href={tool.href}
                          onClick={close}
                          role="menuitem"
                          className="block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {toolT(`${slug}.name`)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
