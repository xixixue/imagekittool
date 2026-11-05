/**
 * Locale configuration for the language switcher (cookie-based, no route prefix).
 * Locale codes follow BCP 47 short tags. Arabic renders RTL.
 */
export const locales = ["en", "zh", "es", "ar", "fr", "pt", "ru", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Native display name + text direction for the switcher and <html dir>. */
export const localeLabels: Record<Locale, { native: string; dir: "ltr" | "rtl" }> = {
  en: { native: "English", dir: "ltr" },
  zh: { native: "汉语", dir: "ltr" },
  es: { native: "Español", dir: "ltr" },
  ar: { native: "العربية", dir: "rtl" },
  fr: { native: "Français", dir: "ltr" },
  pt: { native: "Português", dir: "ltr" },
  ru: { native: "Русский", dir: "ltr" },
  ja: { native: "日本語", dir: "ltr" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
