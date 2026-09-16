import { api } from "../lib/axios";
import {
  AllWalletsResponse,
  Balance,
  DepositHistory,
  GenerateWalletResponse,
  SupportedChains,
  SupportedTokens,
} from "../types/asset";

export const assetKeys = {
  supportedChainsKey: (q: string) => ["assets", "supported-chains", q],
  supportedTokensKey: (q: string) => ["assets", "supported-tokens", q],
  generateWalletKeys: (network: string, walletType: number) => [
    "assets",
    "generate-wallet",
    network,
    walletType,
  ],
  transactionHistory: (params?: any) => ["transaction-history", params],
  allWallets: (params?: any) => ["all-wallets", params],
  convertAsset: ["convert-asset"],
  externalTransferCode: (asset: string) => ["external-transfer-code", asset],
  walletById: (id: string) => ["wallet-by-id", id],
} as const;

export const asset = {
  internalTransfer: async (data: {
    symbol: string;
    fromBalance: string;
    toBalance: string;
    amount: string;
    totpCode?: string;
  }) => {
    const response = await api.post(`wallet/internal_transfer`, {
      symbol: data.symbol,
      amount: data.amount,
      fromBalance: data.fromBalance,
      toBalance: data.toBalance,
      sourceWallet: data.fromBalance,
      destinationWallet: data.toBalance,
      SourceWallet: data.fromBalance,
      DestinationWallet: data.toBalance,
      source_wallet: data.fromBalance,
      destination_wallet: data.toBalance,
    }, data.totpCode ? { headers: { "X-2FA-Code": data.totpCode } } : undefined);
    return response.data;
  },
  convertAsset: async (data: {
    fromAsset: string;
    toAsset: string;
    amount: string;
    sourceWallet?: string;
  }) => {
    const response = await api.post("wallet/convert_asset", {
      fromSymbol: data.fromAsset?.toUpperCase(),
      toSymbol: data.toAsset?.toUpperCase(),
      amount: data.amount,
    });
    return response.data;
  },

  initiateWithdrawal: async (data: {
    chain: string;
    destinationAddress: string;
    amount: string;
    asset: string;
    sourceWallet?: string;
    walletId?: string;
    tokenAddress?: string;
    idempotencyKey?: string;
    totpCode?: string;
  }) => {
    const response = await api.post(
      `wallet/initiate_withdrawal`,
      {
        walletId: data.walletId,
        walletID: data.walletId,
        WalletID: data.walletId,
        asset: data.asset,
        chain: data.chain?.toUpperCase(),
        amount: data.amount,
        destinationAddress: data.destinationAddress,
        sourceWallet: data.sourceWallet,
        tokenAddress: data.tokenAddress,
        TokenAddress: data.tokenAddress,
        contractAddress: data.tokenAddress,
        idempotencyKey: data.idempotencyKey,
        idempotency_key: data.idempotencyKey,
      },
      data.totpCode ? { headers: { "X-2FA-Code": data.totpCode } } : undefined
    );
    return response.data;
  },

  confirmWithdrawal: async (data: { otpCode: string; totpCode?: string }) => {
    const response = await api.post(
      `wallet/confirm_withdrawal`,
      {
        otpCode: data.otpCode,
        otp_code: data.otpCode,
        otp: data.otpCode,
      },
      data.totpCode ? { headers: { "X-2FA-Code": data.totpCode } } : undefined
    );
    return response.data;
  },

  transactionHistory: async (params?: {
    page?: number;
    limit?: number;
    transaction_type?: "deposit" | "withdrawal";
  }) => {
    const response = await api.get<DepositHistory>(
      `wallet/user/transactions_history`,
      {
        params,
      }
    );
    return response.data;
  },
  allTransactionHistory: async () => {
    const response = await api.get<Balance>(`wallet/all_transaction_history`);
    return response.data;
  },
  allWallets: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<AllWalletsResponse>(`wallet/all_wallets`, {
      params,
    });
    return response.data;
  },
  fetchSupportedTokens: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<SupportedTokens>("trading/listed_tokens", {
      params,
    });
    return response.data;
  },
  fetchSupportedChains: async (params?: {
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<SupportedChains>("trading/listed_networks", {
      params,
    });
    return response.data;
  },
  generateWallet: async (data: {
    chain: string;
    userid: string;
    walletType: number;
  }) => {
    const response = await api.post<GenerateWalletResponse>("wallet/generate", {
      ...data,
      chain: data.chain.toUpperCase(),
    });
    return response.data;
  },
  networkFee: async (params: { chain: string; token: string }) => {
    const response = await api.get("wallet/fees", { params: { asset: params.token, network: params.chain } });
    return response.data;
  },
  minimumDeposit: async (params: { token: string; chain?: string }) => {
    const response = await api.get("wallet/minimum_deposit", { params: { asset: params.token } });
    return response.data;
  },
  minimumWithdrawal: async (params: { token: string; chain?: string }) => {
    const response = await api.get("wallet/minimum_withdrawal", { params: { asset: params.token } });
    return response.data;
  },

  getExternalTransferCode: async (asset: string) => {
    const response = await api.get(`wallet/get_external_transfer_code/${asset}`);
    return response.data;
  },

  externalTransfer: async (data: {
    toUserId: string;
    symbol: string;
    fromBalance: string;
    toBalance: string;
    amount: string;
    releaseCode: string;
  }) => {
    const response = await api.post("wallet/external_transfer", {
      symbol: data.symbol?.toUpperCase(),
      amount: data.amount,
      releaseCode: data.releaseCode,
      toUserId: data.toUserId,
      fromBalance: data.fromBalance,
      toBalance: data.toBalance,
      recipientAccount: data.toUserId,
    });
    return response.data;
  },

  initiateDeposit: async (data: {
    walletId: string;
    asset: string;
    network?: string;
  }) => {
    const response = await api.post("wallet/initiate_deposit", data);
    return response.data;
  },

  getWalletById: async (walletId: string) => {
    const response = await api.get(`wallet/${walletId}`);
    return response.data;
  },
};
