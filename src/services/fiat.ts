import { api } from "../lib/axios";
import {
  CardAuthResponse,
  FiatBank,
  FiatQuote,
  FiatWithdrawalResponse,
  PayWithCardResponse,
  TemporaryDepositAccount,
} from "../types/fiat";

export const fiatKeys = {
  quote: ["fiat", "quote"],
  banks: ["fiat", "banks"],
  depositAccount: (params: { symbol: string; bankCode: string; amount: string }) => [
    "fiat",
    "deposit-account",
    params.symbol,
    params.bankCode,
    params.amount,
  ],
  depositConfirm: (reference: string) => ["fiat", "deposit-confirm", reference],
  withdraw: ["fiat", "withdraw"],
  withdrawAuthorize: ["fiat", "withdraw-authorize"],
  cardPay: ["fiat", "card-pay"],
  cardAuth: (reference: string) => ["fiat", "card-auth", reference],
  history: (params?: Record<string, unknown>) => ["fiat", "history", params],
  /** Filters-only key for the infinite-scroll list; `page` is owned by react-query. */
  historyList: (filters: Record<string, unknown> = {}) => [
    "fiat",
    "history",
    "list",
    filters,
  ],
  /** Invalidation prefix — matches both `history` and `historyList` entries. */
  historyRoot: ["fiat", "history"] as const,
} as const;

export const fiatService = {
  getQuote: async (symbol?: string): Promise<FiatQuote> => {
    const response = await api.post("wallet/fiat/quote", symbol ? { symbol } : {});
    return response.data;
  },

  getBanks: async (): Promise<{ banks: FiatBank[] }> => {
    const response = await api.get("wallet/fiat/banks");
    return response.data;
  },

  createDepositAccount: async (data: {
    symbol: string;
    bankCode: string;
    amount: string;
  }): Promise<TemporaryDepositAccount> => {
    const response = await api.post("wallet/fiat/deposit/account", {
      symbol: data.symbol,
      bankCode: data.bankCode,
      amount: data.amount.toString(),
    });
    return response.data;
  },

  confirmDeposit: async (
    transactionReference: string
  ): Promise<{ success?: boolean; message?: string; error?: string }> => {
    const response = await api.post(`wallet/fiat/deposit/${transactionReference}/confirm`);
    return response.data;
  },

  payCard: async (data: {
    symbol: string;
    amount: string;
    cardNumber: string;
    cardExpiryMonth: string;
    cardExpiryYear: string;
    cardPin?: string;
    cardCvv: string;
  }): Promise<PayWithCardResponse> => {
    const response = await api.post("wallet/fiat/card/pay", {
      symbol: data.symbol,
      amount: data.amount,
      cardNumber: data.cardNumber,
      cardExpiryMonth: data.cardExpiryMonth,
      cardExpiryYear: data.cardExpiryYear,
      cardPin: data.cardPin,
      cardCvv: data.cardCvv,
    });
    return response.data;
  },

  cardOtp: async (data: {
    transactionReference: string;
    tokenId: string;
    otp: string;
  }): Promise<CardAuthResponse> => {
    const response = await api.post("wallet/fiat/card/otp", {
      transactionReference: data.transactionReference,
      tokenId: data.tokenId,
      otp: data.otp,
    });
    return response.data;
  },

  card3ds: async (data: {
    transactionReference: string;
    apiKey: string;
    cardNumber: string;
    cardExpiryMonth: string;
    cardExpiryYear: string;
    cardCvv: string;
    cardPin?: string;
  }): Promise<CardAuthResponse> => {
    const response = await api.post("wallet/fiat/card/3ds", {
      transactionReference: data.transactionReference,
      apiKey: data.apiKey,
      cardNumber: data.cardNumber,
      cardExpiryMonth: data.cardExpiryMonth,
      cardExpiryYear: data.cardExpiryYear,
      cardCvv: data.cardCvv,
      cardPin: data.cardPin,
    });
    return response.data;
  },

  withdraw: async (
    data: {
      symbol: string;
      amount: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    },
    totpCode?: string
  ): Promise<FiatWithdrawalResponse> => {
    const response = await api.post(
      "wallet/fiat/withdraw",
      {
        symbol: data.symbol,
        amount: data.amount,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      },
      totpCode ? { headers: { "X-2FA-Code": totpCode } } : undefined
    );
    return response.data;
  },

  authorizeWithdraw: async (data: {
    reference: string;
    authorizationCode: string;
  }): Promise<FiatWithdrawalResponse> => {
    const response = await api.post("wallet/fiat/withdraw/authorize", {
      reference: data.reference,
      authorizationCode: data.authorizationCode,
    });
    return response.data;
  },

  getHistory: async (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get("wallet/fiat/history", { params });
    return response.data;
  },
};