"use client";

import { useMemo } from "react";
import { usePortfolioWs } from "./use-portfolio-ws";
import { deriveFundingBalance } from "@/src/lib/portfolio-utils";

interface WalletBalance {
  inUsd: string;
  inBtc: string;
}

interface UseWalletBalancesReturn {
  funding: WalletBalance | null;
  trading: WalletBalance | null;
  isLoading: boolean;
  isConnected: boolean;
}

function safeParse(val: string | null | undefined): number {
  const n = parseFloat(val ?? "");
  return isNaN(n) ? 0 : n;
}

export function useWalletBalances(): UseWalletBalancesReturn {
  // Overall and individual funding/trading USD totals come from the
  // `overall_portfolio_balance` response. The per-coin stream provides a compatibility
  // fallback and the BTC conversion rate for the account cards.
  const { balances, isLoading, isConnected } = usePortfolioWs({ coins: true, balance: true });

  const { funding, trading } = useMemo(() => {
    const total = balances?.total;
    const fundingBalance = deriveFundingBalance(
      total,
      balances?.spot,
      balances?.futures,
      balances?.margin
    );
    if (!total) return { funding: null, trading: null };

    const totalUsd = safeParse(total.inUsd);
    const totalBtc = safeParse(total.inBtc);
    const hasServerAccountBalances =
      total.fundingBalance != null && total.unifiedTradingBalance != null;

    const fallbackFundingBalance = fundingBalance;
    if (!hasServerAccountBalances && !fallbackFundingBalance) {
      return { funding: null, trading: null };
    }

    const fundingUsd = hasServerAccountBalances
      ? safeParse(total.fundingBalance)
      : fallbackFundingBalance?.inUsd ?? 0;
    const tradingUsd = hasServerAccountBalances
      ? safeParse(total.unifiedTradingBalance)
      : Math.max(0, totalUsd - fundingUsd);
    const btcPerUsd = totalUsd > 0 ? totalBtc / totalUsd : 0;
    const fundingBtc = hasServerAccountBalances
      ? fundingUsd * btcPerUsd
      : fallbackFundingBalance?.inBtc ?? 0;
    const tradingBtc = hasServerAccountBalances
      ? tradingUsd * btcPerUsd
      : Math.max(0, totalBtc - fundingBtc);

    return {
      funding: {
        inUsd: fundingUsd.toFixed(2),
        inBtc: fundingBtc.toFixed(8),
      },
      trading: {
        inUsd: tradingUsd.toFixed(2),
        inBtc: tradingBtc.toFixed(8),
      },
    };
  }, [balances?.total, balances?.spot, balances?.futures, balances?.margin]);

  return {
    funding,
    trading,
    isLoading,
    isConnected,
  };
}