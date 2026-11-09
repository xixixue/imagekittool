import Image from "next/image";
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
/* New diagrams                                                                */
/* -------------------------------------------------------------------------- */

/* PPI (screen pixels per inch) vs DPI (print dots per inch). */
function PpiVsDpi() {
  const stroke = "stroke-current stroke-[1.5]";
  const label = "fill-current text-[14px]";
  const sub = "fill-muted-foreground text-[12px]";
  const sq = 32;
  return (
    <svg viewBox="0 0 720 240" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="PPI screen pixels per inch versus DPI print dots per inch">
      <text x={170} y={26} textAnchor="middle" className={label}>PPI — screen pixels</text>
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 4 }).map((_, c) => (
          <rect key={`p${r}-${c}`} x={60 + c * sq} y={44 + r * sq} width={sq} height={sq} className={`fill-none ${stroke}`} />
        ))
      )}
      <path d="M60 190 L60 196 L188 196 L188 190" className={stroke} fill="none" />
      <text x={124} y={214} textAnchor="middle" className={sub}>1 inch</text>

      <text x={530} y={26} textAnchor="middle" className={label}>DPI — print dots</text>
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => (
          <circle key={`d${r}-${c}`} cx={432 + c * 20} cy={50 + r * 20} r={5} className="fill-current" />
        ))
      )}
      <path d="M427 190 L427 196 L537 196 L537 190" className={stroke} fill="none" />
      <text x={482} y={214} textAnchor="middle" className={sub}>1 inch</text>
    </svg>
  );
}

/* File-size-vs-quality curve with the 80–85 sweet spot shaded. */
function QualitySizeCurve() {
  const label = "fill-current text-[13px]";
  const sub = "fill-muted-foreground text-[11px]";
  const x0 = 70, x1 = 540, yTop = 30, yBot = 220;
  return (
    <svg viewBox="0 0 600 270" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="File size versus JPEG quality sweet spot at 80 to 85">
      <rect x={x0 + (x1 - x0) * 0.8} y={yTop} width={(x1 - x0) * 0.05} height={yBot - yTop} className="fill-primary/15" />
      <path d={`M${x0} ${yTop} L${x0} ${yBot} L${x1} ${yBot}`} className="stroke-current stroke-[1.5]" fill="none" />
      <path d={`M${x0} ${yTop + 8} C 150 ${yTop + 20}, 230 120, 320 175 C 390 200, 470 214, ${x1} ${yBot - 4}`} className="stroke-primary stroke-[2.5]" fill="none" />
      <text x={40} y={yTop + 4} textAnchor="end" className={sub}>size</text>
      <text x={x0} y={yBot + 18} textAnchor="middle" className={sub}>0</text>
      <text x={x1} y={yBot + 18} textAnchor="middle" className={sub}>100</text>
      <text x={(x0 + x1) / 2} y={yBot + 36} textAnchor="middle" className={label}>JPEG quality</text>
      <text x={x0 + (x1 - x0) * 0.825} y={yTop - 6} textAnchor="middle" className="fill-primary text-[11px] font-medium">sweet spot 80–85</text>
    </svg>
  );
}

/* 1-bit / 8-bit / 24-bit gradient bars (manual, no defs). */
function BitDepthGradient() {
  const label = "fill-current text-[12px]";
  const stroke = "stroke-current stroke-[1]";
  const gray = (i: number, n: number) =>
    `rgb(${(30 + i * (215 / (n - 1))) | 0},${(30 + i * (215 / (n - 1))) | 0},${(30 + i * (215 / (n - 1))) | 0})`;
  return (
    <svg viewBox="0 0 600 240" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Color depth comparison 1-bit 8-bit 24-bit gradients">
      <text x={20} y={44} className={label}>1-bit (2 colors)</text>
      <rect x={200} y={30} width={200} height={28} className={`fill-current ${stroke}`} />
      <rect x={300} y={30} width={100} height={28} className="fill-white" stroke="currentColor" strokeWidth={1} />

      <text x={20} y={114} className={label}>8-bit (256 levels)</text>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={200 + i * 25} y={100} width={25} height={28} fill={gray(i, 8)} />
      ))}
      <rect x={200} y={100} width={200} height={28} className={`fill-none ${stroke}`} />

      <text x={20} y={184} className={label}>24-bit (16M colors)</text>
      {Array.from({ length: 50 }).map((_, i) => (
        <rect key={i} x={200 + i * 4} y={170} width={4} height={28} fill={gray(i, 50)} />
      ))}
      <rect x={200} y={170} width={200} height={28} className={`fill-none ${stroke}`} />
      <text x={300} y={222} textAnchor="middle" className="fill-muted-foreground text-[11px]">more bits → smoother gradient</text>
    </svg>
  );
}

/* Five violet squares at increasing alpha over a checkerboard (manual). */
function AlphaChannel() {
  const label = "fill-current text-[12px]";
  const sub = "fill-muted-foreground text-[11px]";
  const cell = (x: number, y: number, dark: boolean) => (
    <rect x={x} y={y} width={10} height={10} fill={dark ? "rgb(220,220,226)" : "rgb(245,245,248)"} />
  );
  return (
    <svg viewBox="0 0 600 180" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="The alpha channel five violet squares at increasing opacity over a checkerboard">
      {Array.from({ length: 5 }).map((_, i) => {
        const x = 20 + i * 116;
        const alpha = i / 4;
        return (
          <g key={i}>
            {Array.from({ length: 10 }).map((_, r) =>
              Array.from({ length: 10 }).map((_, c) => cell(x + c * 10, 20 + r * 10, (c + r) % 2 === 0))
            )}
            <rect x={x} y={20} width={100} height={100} fill="rgb(139,92,246)" opacity={alpha} />
            <rect x={x} y={20} width={100} height={100} fill="none" stroke="currentColor" strokeWidth={1} />
            <text x={x + 50} y={140} textAnchor="middle" className={sub}>{"α="}{alpha === 0 ? "0" : alpha === 1 ? "1" : alpha}</text>
          </g>
        );
      })}
      <text x={300} y={168} textAnchor="middle" className={label}>higher alpha → more opaque</text>
    </svg>
  );
}

/* Resize (distorts circle→ellipse) vs Crop (circle stays circle). */
function ResizeVsCrop() {
  const box = "fill-none stroke-current stroke-[1.5]";
  const arrow = "stroke-current stroke-[1.5]";
  const label = "fill-current text-[12px]";
  return (
    <svg viewBox="0 0 600 280" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Resizing to a new ratio distorts cropping to it does not">
      <text x={20} y={26} className={label}>Resize to 16:9 (distorted)</text>
      <rect x={40} y={40} width={70} height={70} className={box} />
      <circle cx={75} cy={75} r={26} className="fill-primary" />
      <path d="M125 75 L170 75 M162 70 L170 75 L162 80" className={arrow} fill="none" />
      <rect x={180} y={50} width={160} height={50} className={box} />
      <ellipse cx={260} cy={75} rx={56} ry={16} className="fill-primary" />

      <text x={20} y={166} className={label}>Crop to 16:9 (correct)</text>
      <rect x={40} y={180} width={70} height={70} className={box} />
      <circle cx={75} cy={215} r={26} className="fill-primary" />
      <rect x={40} y={195} width={70} height={40} className="fill-none stroke-primary stroke-[1.5]" strokeDasharray="4 3" />
      <path d="M125 215 L170 215 M162 210 L170 215 L162 220" className={arrow} fill="none" />
      <rect x={180} y={190} width={160} height={50} className={box} />
      <circle cx={260} cy={215} r={20} className="fill-primary" />
    </svg>
  );
}

/* Classic image-macro / meme layout: top caption + image + bottom caption. */
function MemeLayout() {
  const label = "fill-current text-[13px]";
  const stroke = "stroke-current stroke-[1.5]";
  return (
    <svg viewBox="0 0 600 400" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Meme image macro layout top caption image bottom caption">
      <rect x={40} y={20} width={520} height={360} rx={8} className={`fill-none ${stroke}`} />
      <rect x={40} y={20} width={520} height={80} className="fill-muted/40" />
      <rect x={40} y={300} width={520} height={80} className="fill-muted/40" />
      <text x={300} y={50} textAnchor="middle" className={label}>TOP CAPTION</text>
      <rect x={160} y={62} width={280} height={20} className="fill-white" />
      <rect x={200} y={84} width={200} height={12} className="fill-white" />
      <text x={300} y={210} textAnchor="middle" className="fill-muted-foreground text-[14px]">IMAGE</text>
      <text x={300} y={330} textAnchor="middle" className={label}>BOTTOM CAPTION</text>
      <rect x={180} y={342} width={240} height={20} className="fill-white" />
      <rect x={210} y={364} width={180} height={12} className="fill-white" />
    </svg>
  );
}

/* Single watermark vs tiled (diagonal) watermark. */
function WatermarkTypes() {
  const box = "fill-none stroke-current stroke-[1.5]";
  const label = "fill-current text-[13px]";
  const mark = "fill-primary";
  return (
    <svg viewBox="0 0 600 240" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Single watermark versus tiled diagonal watermark">
      <text x={130} y={26} textAnchor="middle" className={label}>Single</text>
      <rect x={40} y={40} width={180} height={160} className={box} />
      <text x={130} y={128} textAnchor="middle" className={`${mark} text-[18px] font-bold`} opacity={0.6}>© SAMPLE</text>

      <text x={430} y={26} textAnchor="middle" className={label}>Tiled (diagonal)</text>
      <rect x={340} y={40} width={180} height={160} className={box} />
      <g transform="rotate(-30 430 120)">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 4 }).map((_, c) => (
            <text key={`${r}-${c}`} x={300 + c * 70} y={70 + r * 50} textAnchor="middle" className={`${mark} text-[12px] font-bold`} opacity={0.45}>© SAMPLE</text>
          ))
        )}
      </g>
    </svg>
  );
}

/* Blur (smooth) vs Pixelate (blocky) — manual gradient vs mosaic. */
function BlurVsPixelate() {
  const box = "fill-none stroke-current stroke-[1.5]";
  const label = "fill-current text-[13px]";
  const gray = (v: number) => `rgb(${v},${v},${v})`;
  return (
    <svg viewBox="0 0 600 240" className="mx-auto h-auto w-full max-w-2xl text-muted-foreground" role="img" aria-label="Blur smooth versus pixelate blocky redaction">
      <text x={130} y={26} textAnchor="middle" className={label}>Blur (smooth)</text>
      <rect x={40} y={40} width={180} height={160} className={box} />
      {Array.from({ length: 45 }).map((_, i) => (
        <rect key={i} x={40 + i * 4} y={40} width={4} height={160} fill={gray(60 + Math.round(120 * (1 - Math.abs((i - 22.5) / 22.5))))} />
      ))}

      <text x={430} y={26} textAnchor="middle" className={label}>Pixelate (blocky)</text>
      <rect x={340} y={40} width={180} height={160} className={box} />
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 9 }).map((_, c) => {
          const cx = c - 4, cr = r - 4;
          const d = Math.sqrt(cx * cx + cr * cr) / 5.66;
          return <rect key={`${r}-${c}`} x={340 + c * 20} y={40 + r * 20} width={20} height={20} fill={gray(60 + Math.round(120 * (1 - d)))} />;
        })
      )}
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
  "ppi-vs-dpi": PpiVsDpi,
  "quality-size-curve": QualitySizeCurve,
  "bit-depth-gradient": BitDepthGradient,
  "alpha-channel": AlphaChannel,
  "resize-vs-crop": ResizeVsCrop,
  "meme-layout": MemeLayout,
  "watermark-types": WatermarkTypes,
  "blur-vs-pixelate": BlurVsPixelate,
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
 * Render a guide cover / article hero. Prefers a raster `coverImage` (generated
 * by `scripts/generate-guide-covers.py` via wan2.7-image-pro) cropped to a
 * banner with `object-cover`; falls back to the named SVG diagram when no cover
 * image is present.
 */
export function GuideCover({
  coverImage,
  name,
  className,
  alt = "",
}: {
  coverImage?: string;
  name: DiagramName;
  className?: string;
  alt?: string;
}) {
  if (coverImage) {
    return (
      <div className={"relative h-40 overflow-hidden " + (className ?? "")}>
        <Image
          src={coverImage}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    );
  }
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
