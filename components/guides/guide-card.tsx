import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Guide } from "@/lib/data/guides";
import { ArrowRightIcon } from "@/components/tools/tool-icon";
import { GuideCover } from "./guide-diagram";

/** A guide card for the `/guides` index grid: cover diagram + meta + title. */
export async function GuideCard({ guide }: { guide: Guide }) {
  const t = await getTranslations("Guides");
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <GuideCover name={guide.coverDiagram} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">
            {guide.category}
          </span>
          <span>{t("minRead", { min: guide.readingTimeMin })}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-foreground">
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{guide.description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {t("readArticle")}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
