/**
 * Quick Workflows (SPEC V2 §6, Phase 4).
 *
 * Task-oriented entries that lower the cost of understanding the tools. Each
 * workflow is either a local pipeline (a BatchStep[] chain run via the
 * batch-engine — §5 '工作流底层复用现有图像处理函数，不得复制多套算法实现') or a
 * route to an existing tool that already implements the capability.
 */
import type { BatchStep } from "@/features/batch-engine/steps";

export interface Workflow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Local pipeline steps (when the workflow runs its own chain via applySteps). */
  steps?: BatchStep[];
  /** Delegate to an existing tool route (when the capability already exists). */
  routeTo?: string;
  /** Display original→result size + savings percentage (§6.1, §6.4). */
  showSavings?: boolean;
}

export const WORKFLOWS: Workflow[] = [
  {
    id: "optimize-website",
    name: "Optimize for Website",
    tagline: "Smaller WebP for faster pages",
    description:
      "Convert to WebP and compress in one pass for smaller, web-ready images. Shows the original size, result size, and savings.",
    // Local pipeline — reuses the batch-engine (no algorithm duplication).
    steps: [
      { type: "convert", params: { format: "webp" } },
      { type: "compress", params: { quality: 0.72 } },
    ],
    showSavings: true,
  },
  {
    id: "prepare-instagram",
    name: "Prepare for Instagram",
    tagline: "Post, story, reel sizes",
    description:
      "Resize for Instagram Post, Story, Reel Cover, or Profile with Cover or Contain fit. Delegates to the Social Media Resizer (Instagram presets).",
    routeTo: "/social-media-resizer",
  },
  {
    id: "prepare-printing",
    name: "Prepare for Printing",
    tagline: "Size + DPI + print preview",
    description:
      "Set DPI and preview the print size. Delegates to the DPI Changer, which warns that changing DPI metadata does not add pixels.",
    routeTo: "/dpi-changer",
  },
  {
    id: "reduce-to-target-size",
    name: "Reduce to Target Size",
    tagline: "Hit a KB target",
    description:
      "Iteratively reduce an image to a target file size (50KB–1MB) using size, format, and quality search. Delegates to Compress to KB.",
    routeTo: "/compress-image-to-kb",
    showSavings: true,
  },
];

/** Look up a workflow by id. */
export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}
