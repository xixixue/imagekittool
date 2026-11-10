import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountSubNav } from "@/components/cloud/account-subnav";
import { HistoryView } from "@/components/history/history-view";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Processing History",
  description: "Your processing history.",
  robots: { index: false, follow: false },
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/history");

  const t = await getTranslations("History");
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <AccountSubNav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("localNote")}</p>
      </div>
      <HistoryView />
    </div>
  );
}
