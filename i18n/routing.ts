export const locales = ["en", "fr", "da", "de", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  da: "Dansk",
  de: "Deutsch",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  da: "DA",
  de: "DE",
  es: "ES",
};

export const localeCookieName = "NEXT_LOCALE";
export const localeHeaderName = "x-limiance-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
