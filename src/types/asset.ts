export interface SupportedPairs {
  data: {
    pairs: {
      base: string;
      quote: string;
    }[];
    total_pages: number;
    current_page: number;
    total_records: number;
  };
  statusCode: number;
  message: string;
  error: string;
  success: boolean;
}

export interface SupportedTokens {
  data: {
    symbol: string;
    name: string;
    description: string;
    blockchain: string;
    decimals: number;
    contractAddress: string;
    isStablecoin: boolean;
    image: string;
    isTradable: boolean;
    isFiatPairable: boolean;
    website: string;
    whitepaperUrl: string;
    explorerUrl: string;
    listedAt: string;
    updatedAt: string;
  }[];
  currentPage: string;
  totalPages: string;
  totalRecords: string;
  statusCode: number;
  message: string;
  error: string;
  success: boolean;
}

export interface SupportedChains {
  data: {
    symbol: string;
    name: string;
    description: string;
    blockchain: string;
    decimals: string;
    image: string;
    standard: string;
    supportedPairs: string;
    website: string;
    whitepaperUrl: string;
    explorerUrl: string;
  }[];
  currentPage: string;
  totalPages: string;
  totalRecords: string;
  statusCode: number;
  message: string;
  error: string;
  success: boolean;
}

export interface GenerateWalletResponse {
  StatusCode: number;
  Success: boolean;
  data: {
    id: string;
    userID: string;
    address: string;
    chain: string;
    walletType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    suspendedAt: string;
    suspensionReason: string;
    lastActivityAt: string;
    metadata: { t: string };
  };
  Message: string;
  Error: string;
}

export interface Portfolio {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    userId: string;
    symbol: string;
    name: string;
    currencyPrice: string;
    image: string;
    spotBalance: string;
    futuresBalance: string;
    fundingBalance: string;
    marginBalance: string;
    lockedBalance: string;
    suspensionReason: string;
    suspendedAt: string;
    lastActivityAt: string;
  }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface Balance {
  data: {
    inBtc: string;
    inNgn: string;
    inUsd: string;
    pnl: string;
    pnlPercentage: string;
  };
  statusCode: number;
}

export interface DepositHistory {
  statusCode: number;
  success: boolean;
  message: string;
  data:
    | null
    | {
        id: string;
        walletId: string;
        userId: string;
        type: string;
        status: string;
        asset: string;
        amount: string;
        fee: string;
        fromBalance: string;
        toBalance: string;
        chain: string;
        hash: string;
        createdAt: string;
        updatedAt: string;
        completedAt: string;
        failedAt: string;
        failureReason: string;
        metadata: string;
      }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface StakingProduct {
  id: string;
  asset: string;
  image: string;
  apy: number;
  minAmount: string;
  lockDays: number;
  type: "fixed" | "flexible";
  totalStaked: string;
  available: boolean;
}

export interface StakingPosition {
  id: string;
  productId: string;
  asset: string;
  image: string;
  amount: string;
  earned: string;
  apy: number;
  startDate: string;
  endDate: string;
  lockDays: number;
  type: "fixed" | "flexible";
  status: "active" | "ended";
}

export interface AllWalletsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    userID: string;
    address: string;
    chain: string;
    walletType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    suspendedAt: string;
    suspensionReason: string;
    lastActivityAt: string;
    metadata: any
  }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface Allocation {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  percentage: string;
}

export interface BalanceAllocationsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    totalValue: string;
    allocations: Allocation[] | null;
  };
  error: string;
}
