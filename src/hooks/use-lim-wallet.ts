"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePortfolioWs } from "./use-portfolio-ws";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { rewardsKeys, rewardsService } from "@/src/services/rewards";
import { isLimSymbol, resolveLimLogo } from "@/src/lib/lim";
import { normalizeRewardsSummary, RewardsSummary } from "@/src/lib/rewards";

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface LimWalletState {
  /** Whether the portfolio stream has a LIM entry at all. */
  hasEntry: boolean;
  /** Spendable LIM (funding + spot wallets). */
  available: number;
  /** LIM held in margin/futures trading accounts. */
  inTrading: number;
  /** Locked LIM reported by the portfolio payload. */
  locked: number;
  /** Portfolio-reported logo for LIM, when present. */
  portfolioLogo?: string;
  /** Backend token-list logo, resolved lazily; falls back to undefined. */
  tokenListLogo?: string;
  logo?: string;
  isLoading: boolean;
  refreshBalances: () => void;
}

/**
 * LIM holdings come from the same portfolio WebSocket the wallet surfaces
 * already use — no parallel balance source. Balance-cloak state is applied by
 * the consumers, not here, so the raw numbers stay available for validation.
 */
export function useLimWallet(): LimWalletState {
  const { coins, isLoading, refreshBalances } = usePortfolioWs({ coins: true });

  const limCoin = useMemo(
    () => coins.find((coin) => isLimSymbol(coin.symbol)) ?? null,
    [coins]
  );

  // Token metadata (logo) comes from the backend's own listed-tokens registry,
  // the same endpoint the deposit pickers use. Paged query with a long
  // staleTime: token metadata rarely changes.
  const { data: limTokenRows } = useQuery({
    queryKey: tradingKeys.listedTokens({ query: "LIM" }),
    queryFn: () => tradingService.listedTokens({ query: "LIM", limit: 20 }),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
    staleTime: 30 * 60 * 1000,
    retry: false,
    enabled: !!limCoin,
  });

  const tokenListLogo = useMemo(() => {
    if (!limTokenRows?.length) return undefined;
    return resolveLimLogo(limTokenRows);
  }, [limTokenRows]);

  const available =
    toNumber(limCoin?.fundingBalance) + toNumber(limCoin?.spotBalance);
  const inTrading =
    toNumber(limCoin?.marginBalance) + toNumber(limCoin?.futuresBalance);

  return {
    hasEntry: !!limCoin,
    available,
    inTrading,
    locked: toNumber(limCoin?.lockedBalance),
    portfolioLogo: limCoin?.image || limCoin?.logo || limCoin?.icon || undefined,
    tokenListLogo,
    logo: limCoin?.image || limCoin?.logo || limCoin?.icon || tokenListLogo || undefined,
    isLoading,
    refreshBalances,
  };
}

export interface LimRewardsState {
  summary: RewardsSummary | null;
  isLoading: boolean;
  /** True when the endpoint answered with an error or unusable payload. */
  isUnavailable: boolean;
  refetch: () => void;
}

/**
 * LIM rewards figures. The earn page (`/assets/earn`) and the Buy LIM flow treat this as
 * optional data: when the backend endpoint is not deployed the query resolves
 * to `null` and consumers hide the rewards figures instead of showing zeros.
 */
export function useLimRewardsSummary(): LimRewardsState {
  const query = useQuery({
    queryKey: rewardsKeys.summary,
    queryFn: () => rewardsService.getSummary(),
    select: (res: unknown) => normalizeRewardsSummary(res),
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading,
    isUnavailable: query.isError || (query.isSuccess && query.data == null),
    refetch: () => {
      void query.refetch();
    },
  };
}
