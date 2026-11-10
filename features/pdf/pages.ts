/**
 * Page-range parsing for PDF to Image (SPEC V2 §4.2 P0).
 *
 * Parses expressions like "1-3,5,7-9" into a sorted, de-duplicated list of
 * 1-based page numbers clamped to [1, max]. Pure — no DOM, no pdfjs — so it is
 * fully unit-testable.
 */

/** All pages 1..max. */
export function allPages(max: number): number[] {
  if (max < 1) return [];
  return Array.from({ length: max }, (_, i) => i + 1);
}

function parsePageNum(s: string, max: number): number | null {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return null;
  return Math.min(n, max);
}

/**
 * Parse a page-range expression into a sorted, de-duplicated list clamped to
 * the document's page count. Empty/whitespace input returns all pages.
 */
export function parsePageRange(input: string, max: number): number[] {
  if (max < 1) return [];
  const trimmed = input.trim();
  if (!trimmed) return allPages(max);

  const result = new Set<number>();
  for (const part of trimmed.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const range = p.split("-").map((s) => s.trim());
    if (range.length === 1) {
      const n = parsePageNum(range[0], max);
      if (n) result.add(n);
    } else if (range.length === 2) {
      const a = parsePageNum(range[0], max);
      const b = parsePageNum(range[1], max);
      if (a && b) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        for (let i = lo; i <= hi; i++) result.add(i);
      }
    }
  }
  return [...result].sort((a, b) => a - b);
}
