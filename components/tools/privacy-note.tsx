import { getTranslations } from "next-intl/server";
import { ShieldIcon } from "./tool-icon";

export async function PrivacyNote() {
  const t = await getTranslations("Privacy");
  return (
    <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-xs leading-relaxed text-muted-foreground">{t("note")}</p>
    </div>
  );
}
