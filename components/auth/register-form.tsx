"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { notifyAuthChange } from "@/lib/auth/auth-event";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Registration failed.");
      return;
    }
    track(AnalyticsEvent.signupCompleted);
    notifyAuthChange();
    router.push("/account");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="register-username" className="text-sm font-medium">
          {t("username")}
        </label>
        <input
          id="register-username"
          type="text"
          autoComplete="username"
          aria-invalid={!!errors.username}
          className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register("username")}
        />
        {errors.username && (
          <span className="mt-1 block text-xs text-destructive">{errors.username.message}</span>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">{t("usernameHint")}</span>
      </div>
      <div>
        <label htmlFor="register-email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register("email")}
        />
        {errors.email && (
          <span className="mt-1 block text-xs text-destructive">{errors.email.message}</span>
        )}
      </div>
      <div>
        <label htmlFor="register-password" className="text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register("password")}
        />
        {errors.password && (
          <span className="mt-1 block text-xs text-destructive">{errors.password.message}</span>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">{t("passwordHint")}</span>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isSubmitting ? t("creating") : t("createAccountBtn")}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
