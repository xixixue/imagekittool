import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Tool } from "@/lib/data/tools";
import { ArrowRightIcon, ToolIcon } from "./tool-icon";

export async function ToolCard({ tool }: { tool: Tool }) {
  const t = await getTranslations("Tool");
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-lg"
    >
      <ToolIcon icon={tool.icon} accent={tool.accent} size="lg" />
      <h3 className="mt-4 text-base font-semibold tracking-tight">{t(`${tool.slug}.name`)}</h3>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        {t(`${tool.slug}.tagline`)}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {t(`${tool.slug}.description`)}
      </p>
      <ArrowRightIcon className="mt-4 h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
