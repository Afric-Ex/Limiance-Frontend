import { api } from "../lib/axios";

export interface EarnProduct {
  id: string;
  symbol: string;
  name: string;
  apy: number;
  minAmount: number;
  lockPeriodDays: number;
  isFlexible: boolean;
  isActive: boolean;
  totalCapacity?: number;
  totalSubscribed?: number;
  maxPersonalLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarnPositionProduct {
  id: string;
  symbol: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  isFlexible: boolean;
}

export interface EarnPosition {
  id: string;
  userId: string;
  productId: string;
  product?: EarnPositionProduct;
  asset: string;
  amount: number;
  accruedRewards: number;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarnRewardRecord {
  id: string;
  positionId: string;
  productId: string;
  asset: string;
  amount: number;
  apy: number;
  distributionDate: string;
  type: string; // "DAILY_INTEREST" | "MATURITY_PAYOUT"
}

export interface EarnAssetRewardSummary {
  asset: string;
  totalRewards: number;
  activeStaked: number;
}

export interface EarnRewardsResponse {
  statusCode: number;
  success: boolean;
  message?: string;
  error?: string;
  totalEarnedUsd: number;
  yesterdayRewardsUsd: number;
  thirtyDayRewardsUsd: number;
  totalStakedUsd: number;
  assetSummaries?: EarnAssetRewardSummary[];
  history?: EarnRewardRecord[];
}

export const earnKeys = {
  products: ["earn-products"] as const,
  myPositions: ["earn-my-positions"] as const,
  myRewards: ["earn-my-rewards"] as const,
} as const;

export const earnService = {
  fetchProducts: async (query?: string) => {
    const response = await api.get<{
      statusCode: number;
      success: boolean;
      data: EarnProduct[];
    }>("earn/products", {
      params: query ? { query } : undefined,
    });
    return response.data;
  },

  subscribe: async (data: { productId: string; amount: string }) => {
    const response = await api.post<{
      statusCode: number;
      success: boolean;
      positionId?: string;
      message?: string;
    }>("earn/subscribe", data);
    return response.data;
  },

  unstake: async (data: { subscriptionId: string }) => {
    const response = await api.post<{
      statusCode: number;
      success: boolean;
      message?: string;
    }>("earn/unstake", data);
    return response.data;
  },

  myPositions: async () => {
    const response = await api.get<{
      statusCode: number;
      success: boolean;
      data: EarnPosition[];
    }>("earn/positions");
    return response.data;
  },

  myRewards: async () => {
    const response = await api.get<EarnRewardsResponse>("earn/my_rewards");
    return response.data;
  },
};
