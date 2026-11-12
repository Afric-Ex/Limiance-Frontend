"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  resolveLocale,
} from "@/src/lib/format";

/**
 * Locale-aware presentation helpers. These are for display only — never use
 * them to derive values used in financial calculations.
 */
export function useFormatters() {
  const activeLocale = useLocale();
  const locale = resolveLocale(activeLocale);

  return useMemo(
    () => ({
      locale,
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, options, locale),
      currency: (value: number, currency: string, options?: Intl.NumberFormatOptions) =>
        formatCurrency(value, currency, options, locale),
      date: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, options, locale),
      dateTime: (value: Date | number | string) => formatDateTime(value, locale),
      percent: (value: number, options?: Intl.NumberFormatOptions) =>
        formatPercent(value, options, locale),
      compact: (value: number) => formatCompact(value, locale),
    }),
    [locale]
  );
}
