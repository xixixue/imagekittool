import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountSubNav } from "@/components/cloud/account-subnav";
import { AccountClient } from "@/components/auth/account-client";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Your ImageKitTools account.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <AccountSubNav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("accountTitle")}</h1>
        <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6 text-sm shadow-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("accountEmail")}</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("accountVerified")}</dt>
            <dd className="font-medium">
              {user.emailVerified ? t("verifiedYes") : t("verifiedNo")}
            </dd>
          </div>
        </dl>
        <AccountClient emailVerified={user.emailVerified} />
      </div>
    </div>
  );
}
