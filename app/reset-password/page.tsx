import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your ImageKitTools account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("resetTitle")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("resetDesc")}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
