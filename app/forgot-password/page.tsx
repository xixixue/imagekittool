import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your ImageKitTools account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("forgotTitle")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("forgotDesc")}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
