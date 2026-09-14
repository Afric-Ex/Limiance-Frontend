// true  = use mock data (endpoint not yet available)
// false = use real endpoint (flip when Ayo delivers it)
export const MOCK_MODE = {
  // backend is live — real auth endpoints confirmed
  auth: false,

  // confirmed missing — stay true until Ayo builds them
  networkFee: false,
  minimumDeposit: false,
  minimumWithdrawal: false,
  kycUpload: false,
  kycStatus: false,
  changePassword: true,
  sessions: true,
  apiKeys: true,
  earn: false,
  earnInfo: false,
  openOrders: false,
  orderBook: false,
  spotOrderHistory: false,
  marginOrderHistory: false,
  fiatHistory: false,
  paymentHistory: false,
  transactionAnalysis: false,

  // confirmed live in Postman + wired in frontend
  marketFeed: false, // WebSocket confirmed live — needs Nginx+SSL on backend for wss:// in production
  spotOrder: false,
  futuresOrder: false,
  marginTrading: false,
  settings: false,
  twoFactor: false,
  convertHistory: false,
  gainersLosers: false,
  conversionRate: false,
  chartData: false,
  tradingBot: false,
};
