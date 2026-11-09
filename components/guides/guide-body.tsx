import Image from "next/image";
import type { Block } from "@/lib/data/guides";
import { GuideDiagram } from "./guide-diagram";

/**
 * Renders a guide's body block list. Each block type maps to a small,
 * typographic component; `diagram` blocks render an SVG via the diagram
 * registry and `image` blocks render a raster demonstration image from
 * `/public/guides` with a caption. The list is intentionally flat (no nested
 * sections) to keep authoring and future translation simple.
 */
export function GuideBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} className="pt-4 text-2xl font-bold tracking-tight text-foreground">
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-base leading-relaxed text-muted-foreground">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <div key={i} className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
                <p className="text-sm font-medium leading-relaxed text-foreground">{block.text}</p>
              </div>
            );
          case "diagram":
            return <GuideDiagram key={i} name={block.name} caption={block.caption} />;
          case "image":
            return (
              <figure key={i} className="my-8">
                <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={block.width}
                    height={block.height}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
