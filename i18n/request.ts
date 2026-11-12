import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  isLocale,
  localeHeaderName,
  type Locale,
} from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const headerLocale = (await headers()).get(localeHeaderName);

  const locale: Locale = isLocale(requested)
    ? requested
    : isLocale(headerLocale)
      ? headerLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
