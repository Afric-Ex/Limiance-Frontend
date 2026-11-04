/**
 * User Settings Types - Matches backend API structure
 * GET /api/v1/users/settings
 * PATCH /api/v1/users/app_settings
 */

export interface NotificationPreference {
  activities: boolean;
  news: boolean;
  systemMessages: boolean;
  tradeNotification: boolean;
}

export interface PriceAlerts {
  notificationOn: boolean;
  priceOn: boolean;
}

export interface TradeFeeDeductions {
  useBNBToPayFees: boolean;
  useBNBToPayFuturesFees: boolean;
  useBNBToPayMarginFees: boolean;
}

export interface TradeOrdersNotificationReminder {
  autoBorrowRepayMargin: boolean;
  limitOrder: boolean;
  marketOrder: boolean;
  stopOrder: boolean;
}

export interface TransactionNotifications {
  futuresNotificationSound: boolean;
  futuresTradingNotification: boolean;
  spotNotificationSound: boolean;
  spotTradingNotification: boolean;
}

export interface UserSettings {
  antiPhishingCode: string;
  chartColor: boolean;
  language: string;
  notificationPreference: NotificationPreference;
  priceAlerts: PriceAlerts;
  timezone: string;
  tradeFeeDeductions: TradeFeeDeductions;
  tradeOrdersNotificationReminder: TradeOrdersNotificationReminder;
  transactionNotifications: TransactionNotifications;
  withdrawalWhitelist: boolean;
}

export type PartialUserSettings = Partial<{
  antiPhishingCode: string;
  chartColor: boolean;
  language: string;
  notificationPreference: Partial<NotificationPreference>;
  priceAlerts: Partial<PriceAlerts>;
  timezone: string;
  tradeFeeDeductions: Partial<TradeFeeDeductions>;
  tradeOrdersNotificationReminder: Partial<TradeOrdersNotificationReminder>;
  transactionNotifications: Partial<TransactionNotifications>;
  withdrawalWhitelist: boolean;
}>;
