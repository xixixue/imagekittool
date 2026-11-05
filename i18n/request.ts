import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale } from "./routing";

/**
 * Loads the locale + messages for the current request. The locale is read from
 * the `locale` cookie (set by the language switcher); defaults to English.
 * No route prefix and no middleware required.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
