import { getTranslations } from "next-intl/server";
import { getToolBySlug } from "@/lib/data/tools";
import { ToolIcon } from "./tool-icon";

interface ToolPageHeaderProps {
  slug: string;
}

export async function ToolPageHeader({ slug }: ToolPageHeaderProps) {
  const tool = getToolBySlug(slug);
  const accent = tool?.accent ?? "violet";
  const icon = tool?.icon ?? "image";
  const t = await getTranslations("Tool");
  return (
    <header className="mb-8 flex items-start gap-4">
      <ToolIcon icon={icon} accent={accent} size="lg" className="shrink-0" />
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t(`${slug}.name`)}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t(`${slug}.headerDescription`)}</p>
      </div>
    </header>
  );
}
