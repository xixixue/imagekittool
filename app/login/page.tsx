import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ImageKitTools account to save images to your private cloud.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("signInTitle")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("signInDesc")}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
