// KYC, sessions, API keys, settings

export const MOCK_KYC_STATUS = {
  status: "pending" as "pending" | "approved" | "rejected",
  reason: "",
  submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
};

export const MOCK_SESSIONS = [
  {
    id: "sess_001",
    device: "Chrome on Windows 11",
    location: "Lagos, Nigeria",
    ip: "105.112.34.56",
    lastActive: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: "sess_002",
    device: "Safari on iPhone 15",
    location: "Lagos, Nigeria",
    ip: "105.112.34.78",
    lastActive: new Date(Date.now() - 3 * 86400000).toISOString(),
    isCurrent: false,
  },
];

export const MOCK_API_KEYS = [
  {
    id: "key_001",
    label: "Trading Bot",
    key: "lim_****...a3f2",
    permissions: ["Read", "Trade"],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const MOCK_2FA_QR = {
  qrUrl:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Limiance:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Limiance",
  secret: "JBSWY3DPEHPK3PXP",
};

export const MOCK_SETTINGS = {
  language: "en",
  timezone: "Africa/Lagos",
  notificationPreference: {
    tradeNotification: true,
    activities: true,
    news: false,
    systemMessages: true,
  },
  feeDeduction: "standard",
  chartColors: "default",
};
