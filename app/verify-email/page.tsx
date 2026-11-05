import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your ImageKitTools account email address.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("verifyTitle")}</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </div>
  );
}
