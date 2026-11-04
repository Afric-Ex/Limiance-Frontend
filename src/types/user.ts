export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  country: string;
  username: string;
  photo: string;
  isActive: boolean;
  isIDverified: boolean;
  kycStatus?: string;
  isFuturesAccepted: boolean;
  isFutures_accepted?: boolean;
  twoFaEnabled: boolean;
  emailOtpEnabled?: boolean;
  isVerified: boolean;
  createdAt?: string | number;
  accountCreatedAt?: string | number;
}

export interface UserSettings {
  theme?: string;
  currency?: string;
  antiPhishingCode: string;
  chartColor: boolean;
  language: string;
  notificationPreference: {
    activities: boolean;
    news: boolean;
    systemMessages: boolean;
    tradeNotification: boolean;
  };
  priceAlerts: {
    notificationOn: boolean;
    priceOn: boolean;
  };
  timezone: string;
  tradeFeeDeductions: {
    useBNBToPayFees: boolean;
    useBNBToPayFuturesFees: boolean;
    useBNBToPayMarginFees: boolean;
  };
  tradeOrdersNotificationReminder: {
    autoBorrowRepayMargin: boolean;
    limitOrder: boolean;
    marketOrder: boolean;
    stopOrder: boolean;
  };
  transactionNotifications: {
    futuresNotificationSound: boolean;
    futuresTradingNotification: boolean;
    spotNotificationSound: boolean;
    spotTradingNotification: boolean;
  };
  withdrawalWhitelist: boolean;
}
