"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  portfolioStore,
  topicsForNeeds,
  type PortfolioNeeds,
  type PortfolioTopic,
} from "@/src/lib/portfolio-store";
import {
  type AccountBalance,
  type MarginAccountData,
  type PortfolioAllocations,
  type PortfolioCoin,
} from "@/src/lib/portfolio-utils";

export type {
  PortfolioCoin,
  AllocationItem,
  PortfolioAllocations,
  AccountBalance,
  MarginAsset,
  MarginAccountData,
} from "@/src/lib/portfolio-utils";
export { normalizePortfolioCoins, deriveAccountBalances } from "@/src/lib/portfolio-utils";
export type { PortfolioNeeds } from "@/src/lib/portfolio-store";

interface PortfolioWsData {
  coins: PortfolioCoin[];
  allocations: PortfolioAllocations | null;
  marginAccount: MarginAccountData | null;
  futuresPositions: any[];
  balances: Record<string, AccountBalance>;
  isConnected: boolean;
  isLoading: boolean;
  isAllocationsLoading: boolean;
  /** Per-topic flags set while an explicit refresh() is waiting for fresh data. */
  refreshing: Record<PortfolioTopic, boolean>;
  /** True when any of this caller's requested topics is mid-refresh. */
  isRefreshing: boolean;
  refreshBalances: () => void;
}

/**
 * Subscribe to portfolio data, declaring which topics this caller actually reads.
 *
 * `needs` drives ref-counting: a topic's WebSocket stream (and its REST
 * fallback) opens when the first consumer asks for it and closes when the last
 * one unmounts, so leaving a page tears down the streams it opened. Omit
 * `needs` to request everything — prefer naming them, so a screen only pays for
 * what it renders.
 *
 * @example
 *   // dashboard: holdings table + "Total Assets" card, nothing else
 *   const { coins, balances } = usePortfolioWs({ coins: true, balance: true });
 */
export const usePortfolioWs = (needs?: PortfolioNeeds): PortfolioWsData => {
  // Callers usually pass an inline object literal, so key memo + effect off a
  // serialized form rather than the object identity (a fresh literal every
  // render would otherwise recompute topics pointlessly).
  const needsKey = JSON.stringify(needs ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topics = useMemo(() => topicsForNeeds(needs), [needsKey]);
  const topicKey = topics.join(",");

  const state = useSyncExternalStore(
    portfolioStore.subscribe,
    portfolioStore.getState,
    portfolioStore.getState
  );

  // Hold a reference for as long as this component is mounted; releasing it
  // closes any topic whose last consumer this was.
  useEffect(() => {
    if (topics.length === 0) return;
    return portfolioStore.acquire(topics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicKey]);

  const pending = state.pending;
  const isLoading =
    topics.some((t) => pending[t]) && state.coins.length === 0 && state.balances.total == null;
  const isRefreshing = topics.some((t) => state.refreshing[t]);

  return {
    coins: state.coins,
    balances: state.balances,
    allocations: state.allocations,
    marginAccount: state.marginAccount,
    futuresPositions: state.futuresPositions,
    isConnected: state.isConnected,
    isLoading,
    isAllocationsLoading: pending.allocations,
    refreshing: state.refreshing,
    isRefreshing,
    // Scoped to this caller's topics: a card's refresh button re-requests its
    // own streams instead of every mounted surface's.
    refreshBalances: () => portfolioStore.refresh(topics),
  };
};