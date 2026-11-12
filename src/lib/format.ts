import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";

export function resolveLocale(value?: string | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

function browserLocale(): string {
  if (typeof document !== "undefined" && document.documentElement.lang) {
    return document.documentElement.lang;
  }
  return defaultLocale;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = browserLocale()
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(resolveLocale(locale), options).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
  locale: string = browserLocale()
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

export function formatDate(
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
  locale: string = browserLocale()
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(date);
}

export function formatDateTime(
  value: Date | number | string,
  locale: string = browserLocale()
): string {
  return formatDate(
    value,
    { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" },
    locale
  );
}

export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = browserLocale()
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: "percent",
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCompact(
  value: number,
  locale: string = browserLocale()
): string {
  return formatNumber(
    value,
    { notation: "compact", maximumFractionDigits: 2 },
    locale
  );
}
