export interface FiatBank {
  name: string;
  code: string;
  ussdTemplate?: string;
  baseUssdCode?: string;
}

export interface FiatQuote {
  symbol?: string;
  buyRate?: string;
  sellRate?: string;
  currency?: string;
}

export interface TemporaryDepositAccount {
  success?: boolean;
  error?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  accountDurationSeconds: number;
  ussdPayment?: string;
  requestTime?: string;
  expiresOn?: string;
  transactionReference: string;
  paymentReference?: string;
  amount?: string;
  fee?: string;
  totalPayable?: string;
}

export interface PayWithCardResponse {
  success?: boolean;
  error?: string;
  responseMessage?: string;
  paymentStatus?: string;
  transactionReference?: string;
  paymentReference?: string;
  amountPaid?: string;
  currencyPaid?: string;
}

export interface CardAuthResponse {
  success?: boolean;
  error?: string;
  status?: string;
  message?: string;
  transactionReference?: string;
  paymentReference?: string;
  authorizedAmount?: string;
}

export interface FiatWithdrawalResponse {
  success?: boolean;
  error?: string;
  amount?: string;
  reference: string;
  status?: string;
  dateCreated?: string;
  transactionReference?: string;
  destinationAccountName?: string;
  destinationAccountNumber?: string;
  destinationBankCode?: string;
  destinationBankName?: string;
  narration?: string;
  currency?: string;
}

export interface FiatHistoryItem {
  id: string;
  createdAt: string;
  type: string;
  rate?: string;
  fiatAmount?: string;
  assetAmount?: string;
  asset?: string;
  currency?: string;
  status?: string;
}