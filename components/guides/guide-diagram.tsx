import type { DiagramName } from "@/lib/data/guides";

/**
 * Concept diagrams for the guides content center. Each diagram is a small,
 * self-contained React component (SVG or styled HTML) drawn with `currentColor`
 * and the Tailwind design tokens so it inherits the site palette and stays
 * crisp at any size. A guide references one by name; the `GuideDiagram` registry
 * resolves the name to the component and wraps it in a `<figure>` with an
 * optional caption.
 *
 * Diagrams intentionally contain no business logic or external assets — they
 * are pure vector illustration, so they cost nothing at runtime and add no
 * weight to the JS bundle beyond their own markup.
 */

/* -------------------------------------------------------------------------- */
/* Diagram components                                                          */
/* -------------------------------------------------------------------------- */

/** A feature + browser-support comparison grid for JPG, PNG, and WebP. */
function FormatSupportTable() {
  const rows: { feature: string; jpg: string; png: string; webp: string }[] = [
    { feature: "Compression", jpg: "Lossy", png: "Lossless", webp: "Lossy + lossless" },
    { feature: "Transparency", jpg: "no", png: "yes", webp: "yes" },
    { feature: "Animation", jpg: "no", png: "no (APNG)", webp: "yes" },
    { feature: "Color depth", jpg: "24-bit", png: "8/24/48-bit", webp: "24-bit" },
    { feature: "Browser support", jpg: "Universal", png: "Universal", webp: "Modern (2020+)" },
  ];
  const cell = (v: string) =>
    v === "yes" ? (
      <span className="font-medium text-primary">✓</span>
    ) : v === "no" || v === "no (APNG)" ? (
      <span className="text-muted-foreground/50">—</span>
    ) : (
      <span>{v}</span>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 font-semibold text-foreground">Feature</th>
            <th className="py-2 pr-4 font-semibold text-foreground">JPG</th>
            <th className="py-2 pr-4 font-semibold text-foreground">PNG</th>
            <th className="py-2 font-semibold text-foreground">WebP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.feature} className={i % 2 === 1 ? "bg-muted/40" : ""}>
              <td className="py-2 pr-4 text-muted-foreground">{r.feature}</td>
              <td className="py-2 pr-4 text-foreground">{cell(r.jpg)}</td>
              <td className="py-2 pr-4 text-foreground">{cell(r.png)}</td>
              <td className="py-2 text-foreground">{cell(r.webp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lossy vs lossless encoding flow: transform → branch → compressed file. */
function CompressionFlow() {
  const box = "fill-none stroke-current stroke-[1.5]";
  const arrow = "stroke-current stroke-[1.5]";
  const label = "fill-current text-[13px]";
  const sub = "fill-muted-foreground text-[11px]";
  return (
    <svg viewBox="0 0 760 240" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Lossy versus lossless compression flow diagram">
      {/* Image */}
      <rect x="10" y="100" width="80" height="40" rx="8" className={box} />
      <text x="50" y="124" textAnchor="middle" className={label}>Image</text>
      {/* Transform */}
      <rect x="120" y="100" width="90" height="40" rx="8" className={box} />
      <text x="165" y="124" textAnchor="middle" className={label}>Transform</text>
      {/* Lossless branch */}
      <rect x="300" y="40" width="150" height="40" rx="8" className={box} />
      <text x="375" y="64" textAnchor="middle" className={label}>Reversible encode</text>
      {/* Lossy branch */}
      <rect x="300" y="160" width="110" height="40" rx="8" className={box} />
      <text x="355" y="184" textAnchor="middle" className={label}>Quantize</text>
      <rect x="440" y="160" width="120" height="40" rx="8" className={box} />
      <text x="500" y="184" textAnchor="middle" className={label}>Entropy encode</text>
      {/* Compressed file */}
      <rect x="600" y="100" width="150" height="40" rx="8" className={box} />
      <text x="675" y="124" textAnchor="middle" className={label}>Compressed file</text>
      {/* Branch labels */}
      <text x="262" y="78" textAnchor="middle" className={sub}>lossless</text>
      <text x="262" y="158" textAnchor="middle" className={sub}>lossy</text>
      {/* Arrows */}
      <path d="M90 120 L120 120" className={arrow} fill="none" />
      <path d="M210 115 C 240 115, 240 60, 300 60" className={arrow} fill="none" />
      <path d="M210 125 C 240 125, 240 180, 300 180" className={arrow} fill="none" />
      <path d="M410 180 L440 180" className={arrow} fill="none" />
      <path d="M450 80 C 540 80, 560 115, 600 115" className={arrow} fill="none" />
      <path d="M560 180 C 590 180, 590 125, 600 125" className={arrow} fill="none" />
    </svg>
  );
}

/**
 * The eight EXIF orientation values, shown as a transformed glyph in each cell.
 * The glyph is an "F" (asymmetric, so every transform is unambiguous).
 */
function ExifRotation() {
  // F glyph path centered in a 0..40 local box (stroke, currentColor).
  const fPath = "M8 4 L8 36 M8 4 L26 4 M8 18 L22 18";
  const fStroke = "stroke-current stroke-[2.5] fill-none";
  // Each cell: translate to position, then apply the orientation transform
  // inside a 40x40 area centered at (20,20).
  const cells: { n: number; tf: string }[] = [
    { n: 1, tf: "" },
    { n: 2, tf: "translate(40,0) scale(-1,1)" }, // mirror horizontal
    { n: 3, tf: "translate(40,40) scale(-1,-1)" }, // rotate 180
    { n: 4, tf: "translate(0,40) scale(1,-1)" }, // mirror vertical
    { n: 5, tf: "matrix(0,1,1,0,0,0)" }, // transpose
    { n: 6, tf: "rotate(90 20 20)" }, // rotate 90 CW
    { n: 7, tf: "matrix(0,-1,-1,0,40,40)" }, // transverse
    { n: 8, tf: "rotate(-90 20 20)" }, // rotate 90 CCW
  ];
  const cellW = 80;
  const cellH = 90;
  const pad = 8;
  const cols = 4;
  const label = "fill-current text-[13px]";
  const sub = "fill-muted-foreground text-[11px]";
  return (
    <svg
      viewBox={`0 0 ${cols * cellW + pad * 2} ${Math.ceil(cells.length / cols) * cellH + pad * 2}`}
      className="mx-auto h-auto w-full max-w-2xl text-muted-foreground"
      role="img"
      aria-label="The eight EXIF orientation values shown as a transformed F glyph"
    >
      {cells.map((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const ox = pad + col * cellW;
        const oy = pad + row * cellH;
        // Draw the F centered in the cell (cell inner area 40x40 at (20,20) offset).
        const innerX = ox + (cellW - 40) / 2;
        const innerY = oy + (cellH - 40) / 2 - 6;
        return (
          <g key={c.n}>
            <rect x={ox} y={oy} width={cellW - 6} height={cellH - 16} rx="8" className="fill-muted/30 stroke-current stroke-[1.5]" />
            <g transform={`translate(${innerX},${innerY})`}>
              <g transform={c.tf}>
                <path d={fPath} className={fStroke} />
              </g>
            </g>
            <text x={ox + (cellW - 6) / 2} y={oy + cellH - 4} textAnchor="middle" className={i === 0 ? label : sub}>
              {c.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Five common social-media aspect ratios drawn at their true proportions. */
function AspectRatioBoxes() {
  const boxes: { ratio: string; w: number }[] = [
    { ratio: "1:1", w: 100 },
    { ratio: "4:5", w: 80 },
    { ratio: "1.91:1", w: 191 },
    { ratio: "16:9", w: 178 },
    { ratio: "9:16", w: 56 },
  ];
  const h = 100;
  const gap = 22;
  const pad = 12;
  const totalW = boxes.reduce((s, b) => s + b.w, 0) + gap * (boxes.length - 1) + pad * 2;
  const label = "fill-current text-[12px]";
  const box = "fill-muted/30 stroke-current stroke-[1.5]";
  let x = pad;
  return (
    <svg viewBox={`0 0 ${totalW} 150`} className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Common social media aspect ratios at their true proportions">
      {boxes.map((b) => {
        const bx = x;
        const by = 20;
        const center = bx + b.w / 2;
        x += b.w + gap;
        return (
          <g key={b.ratio}>
            <rect x={bx} y={by} width={b.w} height={h} rx="4" className={box} />
            <text x={center} y={by + h + 18} textAnchor="middle" className={label}>
              {b.ratio}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Registry + public components                                               */
/* -------------------------------------------------------------------------- */

const DIAGRAMS: Partial<Record<DiagramName, React.FC>> = {
  "format-support-table": FormatSupportTable,
  "compression-flow": CompressionFlow,
  "exif-rotation": ExifRotation,
  "aspect-ratio-boxes": AspectRatioBoxes,
};

/**
 * Render a named diagram inside a figure with an optional caption. Used inline
 * in article bodies. Returns null for an unregistered name so an article can
 * safely reference a diagram before its component exists.
 */
export function GuideDiagram({ name, caption }: { name: DiagramName; caption?: string }) {
  const Cmp = DIAGRAMS[name];
  if (!Cmp) return null;
  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-4 sm:p-6">
        <Cmp />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Render a named diagram as a card cover / article hero. Same component as the
 * inline diagram, framed as a compact banner.
 */
export function GuideCover({ name, className }: { name: DiagramName; className?: string }) {
  const Cmp = DIAGRAMS[name];
  if (!Cmp) {
    // Fallback cover for a guide whose diagram is not yet implemented.
    return (
      <div className={"flex h-40 items-center justify-center bg-gradient-to-br from-muted to-muted/40 " + (className ?? "")}>
        <span className="text-3xl font-bold text-muted-foreground/40">Guide</span>
      </div>
    );
  }
  return (
    <div className={"flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-muted to-muted/40 p-4 " + (className ?? "")}>
      <Cmp />
    </div>
  );
}
