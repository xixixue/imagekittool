import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an ImageKitTools account to save images to your private cloud.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const t = await getTranslations("Auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("createAccountTitle")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("createAccountDesc")}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
