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
  // Total comes from get_portfolio_balance. The other account balances come
  // from the per-coin stream; Funding and Unified Trading are the remaining
  // amounts after those account balances are subtracted from Total.
  const { balances, isLoading, isConnected } = usePortfolioWs({ coins: true, balance: true });

  const { funding, trading } = useMemo(() => {
    const total = balances?.total;
    const fundingBalance = deriveFundingBalance(
      total,
      balances?.spot,
      balances?.futures,
      balances?.margin
    );
    if (!total || !fundingBalance) return { funding: null, trading: null };
    const totalUsd = safeParse(total.inUsd);
    const totalBtc = safeParse(total.inBtc);
    const tradingUsd = Math.max(0, totalUsd - fundingBalance.inUsd);
    const tradingBtc = Math.max(0, totalBtc - fundingBalance.inBtc);

    return {
      funding: {
        inUsd: fundingBalance.inUsd.toFixed(2),
        inBtc: fundingBalance.inBtc.toFixed(8),
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