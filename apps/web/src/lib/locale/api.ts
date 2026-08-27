import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { defaultLocale, locales, type AppLocale } from "./locales";

export const getRequestLocale = createServerFn({ method: "GET" }).handler(() => {
    const acceptLanguage = getRequestHeader("accept-language");

    const firstLang = acceptLanguage?.split(",")[0];

    const locale = (firstLang?.split(/[-_]/)[0]?.toLowerCase() ?? defaultLocale) as AppLocale;

    return locales.includes(locale) ? locale : defaultLocale;
});
