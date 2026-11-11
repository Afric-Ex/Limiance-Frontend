import type { PartialUserSettings, UserSettings } from "../types/settings";

/**
 * Backend defaults for `PATCH /users/app_settings`. The endpoint expects the
 * complete settings document, so any field the current UI does not touch must
 * still be sent to avoid wiping it.
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  antiPhishingCode: "",
  chartColor: true,
  language: "en",
  notificationPreference: {
    activities: false,
    news: false,
    systemMessages: false,
    tradeNotification: false,
  },
  priceAlerts: {
    notificationOn: false,
    priceOn: false,
  },
  timezone: "UTC",
  tradeFeeDeductions: {
    useLIMToPayFees: false,
    useLIMToPayFuturesFees: false,
    useLIMToPayMarginFees: false,
  },
  tradeOrdersNotificationReminder: {
    autoBorrowRepayMargin: false,
    limitOrder: false,
    marketOrder: false,
    stopOrder: false,
  },
  transactionNotifications: {
    futuresNotificationSound: false,
    futuresTradingNotification: false,
    spotNotificationSound: false,
    spotTradingNotification: false,
  },
  withdrawalWhitelist: false,
};

/**
 * Merge a partial change into the settings document loaded from the API and
 * return the full body required by `PATCH /users/app_settings`.
 */
export function buildSettingsPayload(
  current: PartialUserSettings | UserSettings | null | undefined,
  patch: PartialUserSettings = {}
): UserSettings {
  const base: PartialUserSettings | UserSettings = current ?? {};

  return {
    antiPhishingCode:
      patch.antiPhishingCode ?? base.antiPhishingCode ?? DEFAULT_USER_SETTINGS.antiPhishingCode,
    chartColor: patch.chartColor ?? base.chartColor ?? DEFAULT_USER_SETTINGS.chartColor,
    language: patch.language ?? base.language ?? DEFAULT_USER_SETTINGS.language,
    notificationPreference: {
      ...DEFAULT_USER_SETTINGS.notificationPreference,
      ...base.notificationPreference,
      ...patch.notificationPreference,
    },
    priceAlerts: {
      ...DEFAULT_USER_SETTINGS.priceAlerts,
      ...base.priceAlerts,
      ...patch.priceAlerts,
    },
    timezone: patch.timezone ?? base.timezone ?? DEFAULT_USER_SETTINGS.timezone,
    tradeFeeDeductions: {
      ...DEFAULT_USER_SETTINGS.tradeFeeDeductions,
      ...base.tradeFeeDeductions,
      ...patch.tradeFeeDeductions,
    },
    tradeOrdersNotificationReminder: {
      ...DEFAULT_USER_SETTINGS.tradeOrdersNotificationReminder,
      ...base.tradeOrdersNotificationReminder,
      ...patch.tradeOrdersNotificationReminder,
    },
    transactionNotifications: {
      ...DEFAULT_USER_SETTINGS.transactionNotifications,
      ...base.transactionNotifications,
      ...patch.transactionNotifications,
    },
    withdrawalWhitelist:
      patch.withdrawalWhitelist ??
      base.withdrawalWhitelist ??
      DEFAULT_USER_SETTINGS.withdrawalWhitelist,
  };
}
