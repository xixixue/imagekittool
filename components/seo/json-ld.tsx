import type { ReactElement } from "react";

/**
 * Renders a JSON-LD structured-data `<script>` (SPEC V2 §9.2).
 *
 * Server component. Serializes one or more schema.org graphs verbatim — no
 * transformation that could drift from the page's real content. Pass an array
 * to emit a separate graph per entry within a single script tag.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
