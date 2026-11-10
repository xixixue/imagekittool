"use client";

import { useEffect } from "react";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Fires a `tool_view` event when a tool page mounts (SPEC V2 §13.1). Rendered
 * once per tool page inside ToolPageHeader. Renders nothing.
 */
export function ToolViewTracker({ toolId }: { toolId: string }) {
  useEffect(() => {
    track(AnalyticsEvent.toolView, { tool_id: toolId });
  }, [toolId]);
  return null;
}
