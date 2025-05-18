import { createServerFn } from "@tanstack/start";
import { getHeader } from "@tanstack/start/server";
import { defaultLocale, locales, type AppLocale } from "./locales";

export const getRequestLocale = createServerFn({ method: "GET" }).handler(() => {
    const acceptLanguage = getHeader("accept-language");

    const firstLang = acceptLanguage?.split(",")[0];

    const locale = (firstLang?.split(/[-_]/)[0]?.toLowerCase() ?? defaultLocale) as AppLocale;

    return locales.includes(locale) ? locale : defaultLocale;
});
