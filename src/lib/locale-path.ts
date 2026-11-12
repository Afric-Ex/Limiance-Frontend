import { locales } from "@/i18n/routing";

const LOCALE_PREFIX_RE = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

/** Remove the leading locale segment from a pathname (e.g. /fr/dashboard → /dashboard). */
export function stripLocalePrefix(pathname: string): string {
  if (!pathname) return "/";
  const stripped = pathname.replace(LOCALE_PREFIX_RE, "");
  return stripped === "" ? "/" : stripped;
}

/** Prefix an internal path with a locale, preserving an already-localized path. */
export function withLocale(locale: string, pathname: string): string {
  const stripped = stripLocalePrefix(pathname);
  return `/${locale}${stripped === "/" ? "" : stripped}`;
}
