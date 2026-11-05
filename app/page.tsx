import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ToolCard } from "@/components/tools/tool-card";
import { CloudIcon, ShieldIcon, UserIcon } from "@/components/tools/tool-icon";
import { tools } from "@/lib/data/tools";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const t = await getTranslations("Home");
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <ShieldIcon className="h-3.5 w-3.5" />
            {t("badge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-sm transition-transform hover:scale-[1.02]"
            >
              {t("browseTools")}
            </Link>
            <Link
              href="/image-compressor"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              {t("tryCompressor")}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/80">
            <span>{t("noSignup")}</span>
            <span aria-hidden>·</span>
            <span>{t("noUpload")}</span>
            <span aria-hidden>·</span>
            <span>{t("optionalCloud")}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("allTools")}</h2>
            <p className="mt-2 text-muted-foreground">{t("allToolsSub")}</p>
          </div>
          <Link
            href="/tools"
            className="hidden text-sm font-medium text-primary hover:underline sm:inline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
          <ValueProp icon={<ShieldIcon className="h-6 w-6" />} title={t("localFirstTitle")}>
            {t("localFirstDesc")}
          </ValueProp>
          <ValueProp icon={<UserIcon className="h-6 w-6" />} title={t("noSignupTitle")}>
            {t("noSignupDesc")}
          </ValueProp>
          <ValueProp icon={<CloudIcon className="h-6 w-6" />} title={t("optionalCloudTitle")}>
            {t("optionalCloudDesc")}
          </ValueProp>
        </div>
      </section>
    </>
  );
}

function ValueProp({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
