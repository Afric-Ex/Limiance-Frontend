"use client";

import { useMemo } from "react";
import { usePortfolioWs } from "./use-portfolio-ws";

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
  const { balances, isLoading, isConnected } = usePortfolioWs();

  const funding = useMemo(() => {
    const b = balances?.funding;
    if (!b) return null;
    return {
      inUsd: safeParse(b.inUsd).toFixed(2),
      inBtc: safeParse(b.inBtc).toFixed(8),
    };
  }, [balances?.funding]);

  const total = useMemo(() => {
    const b = balances?.total;
    if (!b) return null;
    return {
      inUsd: safeParse(b.inUsd),
      inBtc: safeParse(b.inBtc),
    };
  }, [balances?.total]);

  const trading = useMemo(() => {
    if (!total || !funding) return null;
    const usd = Math.max(0, total.inUsd - funding.inUsd);
    const btc = Math.max(0, total.inBtc - funding.inBtc);
    return {
      inUsd: usd.toFixed(2),
      inBtc: btc.toFixed(8),
    };
  }, [total, funding]);

  return {
    funding,
    trading,
    isLoading,
    isConnected,
  };
}