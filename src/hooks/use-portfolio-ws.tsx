"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCookie } from "cookies-next";
import { api } from "@/src/lib/axios";
import { wsClient } from "@/src/lib/websocket-client";

export interface PortfolioCoin {
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
  pnlBalance: string;
  pnl?: string;
  pnlPercentage?: string;
}

export interface AllocationItem {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  percentage: string;
}

export interface PortfolioAllocations {
  totalValue: string;
  allocations: AllocationItem[];
}

export interface AccountBalance {
  inUsd: string;
  inBtc: string;
  inNgn: string;
  pnl: string;
  pnlPercentage: string;
}

export interface MarginAsset {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  net_balance: string;
  total_liability: string;
}

export interface MarginAccountData {
  assets: MarginAsset[];
  auto_borrow: boolean;
  auto_repay: boolean;
  equity_usd: string;
  margin_level: string;
  max_leverage: string;
  mode: string;
  total_assets_usd: string;
  total_liability_usd: string;
  user_id: string;
  // Optional camelCase fallbacks in case backend responds with camelCase
  totalAssetsUsd?: string;
  totalLiabilitiesUsd?: string;
  totalLiabilityUsd?: string;
  equityUsd?: string;
  equity?: string;
  marginLevel?: string;
  maxLeverage?: string;
}

interface PortfolioWsData {
  coins: PortfolioCoin[];
  allocations: PortfolioAllocations | null;
  marginAccount: MarginAccountData | null;
  futuresPositions: any[];
  balances: Record<string, AccountBalance>;
  isConnected: boolean;
  isLoading: boolean;
  isAllocationsLoading: boolean;
  refreshBalances: () => void;
}

const numericValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Merge duplicate API rows so consumers always receive one row per asset. */
export function normalizePortfolioCoins(coins: any[]): PortfolioCoin[] {
  const merged = new Map<string, PortfolioCoin>();

  coins.forEach((coin) => {
    const symbol = String(coin?.symbol ?? "").trim();
    if (!symbol) return;

    const key = symbol.toUpperCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...coin,
        symbol,
        spotBalance: String(coin.spotBalance ?? coin.spot_balance ?? "0"),
        futuresBalance: String(coin.futuresBalance ?? coin.futures_balance ?? "0"),
        fundingBalance: String(coin.fundingBalance ?? coin.funding_balance ?? "0"),
        marginBalance: String(coin.marginBalance ?? coin.margin_balance ?? "0"),
      });
      return;
    }

    existing.spotBalance = String(numericValue(existing.spotBalance) + numericValue(coin.spotBalance ?? coin.spot_balance));
    existing.futuresBalance = String(numericValue(existing.futuresBalance) + numericValue(coin.futuresBalance ?? coin.futures_balance));
    existing.fundingBalance = String(numericValue(existing.fundingBalance) + numericValue(coin.fundingBalance ?? coin.funding_balance));
    existing.marginBalance = String(numericValue(existing.marginBalance) + numericValue(coin.marginBalance ?? coin.margin_balance));
    existing.lockedBalance = String(numericValue(existing.lockedBalance) + numericValue(coin.lockedBalance ?? coin.locked_balance));
    existing.pnlBalance = String(numericValue(existing.pnlBalance) + numericValue(coin.pnlBalance ?? coin.pnl_balance));
  });

  return Array.from(merged.values());
}

/** Derive per-account USD totals + server 24h P&L from per-coin portfolio data */
function deriveAccountBalances(coins: any[]): Record<string, AccountBalance> {
  const totals: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const pnl: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const pnlPctWeighted: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };
  const hasServerPnl: Record<string, boolean> = { spot: false, funding: false, futures: false, margin: false };

  coins.forEach((c) => {
    const price = parseFloat(c.currencyPrice || c.usdPrice || c.price || "0");
    const spot = parseFloat(c.spotBalance || c.spot_balance || c.balance || c.free || "0");
    const funding = parseFloat(c.fundingBalance || c.funding_balance || "0");
    const futures = parseFloat(c.futuresBalance || c.futures_balance || "0");
    const margin = parseFloat(c.marginBalance || c.margin_balance || "0");

    totals.spot    += spot    * price;
    totals.funding += funding * price;
    totals.futures += futures * price;
    totals.margin  += margin  * price;

    // Server 24h P&L per coin (from get_portfolio)
    const rawPnl = c.pnl ?? c.pnl_24h;
    const coinPnl = rawPnl != null && rawPnl !== "" ? parseFloat(rawPnl) : NaN;
    if (!Number.isFinite(coinPnl)) return;

    const rawPct = c.pnlPercentage ?? c.pnl_percentage;
    const coinPct = rawPct != null && rawPct !== "" ? parseFloat(rawPct) : NaN;

    const totalBal = funding + futures + margin + spot;
    const wallets: Array<[string, number]> = [
      ["spot", spot],
      ["funding", funding],
      ["futures", futures],
      ["margin", margin],
    ];

    for (const [key, bal] of wallets) {
      if (bal <= 0) continue;
      hasServerPnl[key] = true;
      const share = totalBal > 0 ? bal / totalBal : 1;
      const scaled = coinPnl * share;
      pnl[key] += scaled;
      // Aggregate the server pnlPercentage (fraction, e.g. 0.00496626) weighted
      // by each coin's P&L contribution — no frontend price math.
      if (Number.isFinite(coinPct) && scaled !== 0) {
        pnlPctWeighted[key] += scaled * coinPct;
      }
    }
  });

  const btcCoin = coins.find((c) => c.symbol === "BTC");
  const btcPrice = parseFloat(btcCoin?.currencyPrice || btcCoin?.price || "1") || 1;

  const makeBalance = (usd: number, key: string): AccountBalance => ({
    inUsd: usd.toFixed(8),
    inBtc: (usd / btcPrice).toFixed(8),
    inNgn: (usd * 1600).toFixed(2),
    pnl: hasServerPnl[key] ? pnl[key].toFixed(8) : "0",
    pnlPercentage:
      hasServerPnl[key] && pnl[key] !== 0 ? (pnlPctWeighted[key] / pnl[key]).toFixed(8) : "0",
  });

  return {
    spot:    makeBalance(totals.spot, "spot"),
    funding: makeBalance(totals.funding, "funding"),
    futures: makeBalance(totals.futures, "futures"),
    margin:  makeBalance(totals.margin, "margin"),
  };
}

let httpFetchPromise: Promise<any> | null = null;
let lastHttpFetchTime = 0;

const fetchHttpFallbackData = async () => {
  if (Date.now() - lastHttpFetchTime < 5000 && httpFetchPromise) {
    return httpFetchPromise;
  }
  httpFetchPromise = (async () => {
    try {
      const [portfolioRes, allocRes, marginRes, futuresRes, balanceRes] = await Promise.allSettled([
        api.get("wallet/portfolio", { params: { limit: 100 } }),
        api.get("wallet/balance_allocations"),
        api.get("trading/margin/account"),
        api.get("trading/futures/positions"),
        api.get("wallet/balance")
      ]);

      const result: any = {};
      const responseBody = (settled: PromiseSettledResult<any>) =>
        settled.status === "fulfilled"
          ? settled.value?.data
          : settled.reason?.response?.data;

      const portfolioBody = responseBody(portfolioRes);
      if (Array.isArray(portfolioBody?.data)) {
        result.coins = normalizePortfolioCoins(portfolioBody.data);
      } else if (Array.isArray(portfolioBody)) {
        result.coins = normalizePortfolioCoins(portfolioBody);
      }

      if (allocRes.status === "fulfilled" && allocRes.value.data?.data) {
        result.allocations = allocRes.value.data.data;
      } else if (allocRes.status === "fulfilled" && allocRes.value.data) {
        result.allocations = allocRes.value.data;
      }

      if (marginRes.status === "fulfilled" && marginRes.value.data?.data) {
        result.marginAccount = marginRes.value.data.data;
      } else if (marginRes.status === "fulfilled" && marginRes.value.data) {
        result.marginAccount = marginRes.value.data;
      }

      if (futuresRes.status === "fulfilled" && futuresRes.value.data?.data) {
        result.futuresPositions = futuresRes.value.data.data;
      } else if (futuresRes.status === "fulfilled" && Array.isArray(futuresRes.value.data)) {
        result.futuresPositions = futuresRes.value.data;
      }

      if (balanceRes.status === "fulfilled" && balanceRes.value.data?.data) {
        result.totalBalance = balanceRes.value.data.data;
      } else if (balanceRes.status === "fulfilled" && balanceRes.value.data) {
        result.totalBalance = balanceRes.value.data;
      }

      return result;
    } catch (e) {
      console.error("HTTP fallback error", e);
      return null;
    }
  })();

  lastHttpFetchTime = Date.now();
  return httpFetchPromise;
};

export const usePortfolioWs = (): PortfolioWsData => {
  const [data, setData] = useState<PortfolioWsData>({
    coins: [],
    allocations: null,
    marginAccount: null,
    futuresPositions: [],
    balances: {},
    isConnected: false,
    isLoading: true,
    isAllocationsLoading: true,
    refreshBalances: () => {},
  });

  // If WS doesn't deliver data within 5s, trigger HTTP fallback
  const wsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if WS has ever delivered data so we avoid redundant HTTP overwrites
  const wsHasDataRef = useRef(false);

  const applyHttpFallbackData = useCallback(async () => {
    const fallbackData = await fetchHttpFallbackData();
    if (fallbackData) {
      setData((prev) => {
        const newData = { ...prev };
        if (fallbackData.coins) {
          newData.coins = fallbackData.coins;
          newData.balances = { ...prev.balances, ...deriveAccountBalances(fallbackData.coins) };
        }
        if (fallbackData.totalBalance && fallbackData.totalBalance.inUsd !== undefined) {
          newData.balances = {
            ...newData.balances,
            total: {
              inUsd: fallbackData.totalBalance.inUsd ?? "0",
              inBtc: fallbackData.totalBalance.inBtc ?? "0",
              inNgn: fallbackData.totalBalance.inNgn ?? "0",
              pnl: fallbackData.totalBalance.pnl ?? "0",
              pnlPercentage: fallbackData.totalBalance.pnlPercentage ?? "0",
            }
          };
        }
        if (fallbackData.allocations) {
          newData.allocations = {
            totalValue: fallbackData.allocations.totalValue ?? "0",
            allocations: Array.isArray(fallbackData.allocations.allocations) ? fallbackData.allocations.allocations : [],
          };
        }
        if (fallbackData.marginAccount) newData.marginAccount = fallbackData.marginAccount;
        if (fallbackData.futuresPositions) newData.futuresPositions = fallbackData.futuresPositions;
        newData.isLoading = false;
        newData.isAllocationsLoading = false;
        return newData;
      });
    } else {
      setData((prev) => ({ ...prev, isLoading: false, isAllocationsLoading: false }));
    }
  }, []);

  // refreshBalances uses WS when connected, HTTP otherwise
  const refreshBalances = useCallback(() => {
    const token =
      (typeof localStorage !== "undefined" ? localStorage.getItem("auth-token") : null) ||
      getCookie("auth-token");
    if (!token) {
      applyHttpFallbackData();
      return;
    }

    if (wsClient.getIsConnected()) {
      wsClient.send({ type: "get_portfolio", data: { page: "1", limit: "100", query: "" } });
      wsClient.send({ type: "get_portfolio_balance_allocations", data: {} });
      wsClient.send({ type: "get_portfolio_balance", data: { account: "spot" } });
      wsClient.send({ type: "get_margin_account", data: {} });
      wsClient.send({ type: "get_futures_positions", data: {} });
    } else {
      applyHttpFallbackData();
    }
  }, [applyHttpFallbackData]);

  useEffect(() => {
    const token =
      (typeof localStorage !== "undefined" ? localStorage.getItem("auth-token") : null) ||
      getCookie("auth-token");
    if (!token) {
      applyHttpFallbackData();
      return;
    }

    // If WS doesn't deliver data within 5s, fall back to HTTP
    if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
    wsTimeoutRef.current = setTimeout(() => {
      if (!wsHasDataRef.current) {
        console.warn("[portfolio-ws] WS slow/failed — loading HTTP fallback");
        applyHttpFallbackData();
      }
    }, 5000);

    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected && !wsHasDataRef.current) {
        applyHttpFallbackData();
      }
    });

    const unsubs: Array<() => void> = [];

    // 1. Portfolio items
    unsubs.push(
      wsClient.subscribe(
        "portfolio",
        { type: "get_portfolio", data: { page: "1", limit: "100", query: "" } },
        (rawPayload, fullMsg) => {
          const payload = fullMsg?.data ?? rawPayload;
          const items: PortfolioCoin[] = normalizePortfolioCoins(Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
            ? payload
            : []);
          if (items.length > 0) {
            wsHasDataRef.current = true;
            if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
            const derivedBalances = deriveAccountBalances(items);
            setData((prev) => ({
              ...prev,
              coins: items,
              isLoading: false,
              balances: { ...prev.balances, ...derivedBalances },
            }));
          }
        }
      )
    );

    // 2. Portfolio balance
    unsubs.push(
      wsClient.subscribe(
        "portfolio_balance",
        { type: "get_portfolio_balance", data: { account: "spot" } },
        (rawPayload, fullMsg) => {
          const raw = fullMsg?.data?.data ?? fullMsg?.data ?? rawPayload;
          if (raw && raw.inUsd !== undefined) {
            wsHasDataRef.current = true;
            if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
            setData((prev) => ({
              ...prev,
              balances: {
                ...prev.balances,
                total: {
                  inUsd: raw.inUsd ?? "0",
                  inBtc: raw.inBtc ?? "0",
                  inNgn: raw.inNgn ?? "0",
                  pnl: raw.pnl ?? "0",
                  pnlPercentage: raw.pnlPercentage ?? "0",
                },
              },
            }));
          }
        }
      )
    );

    // 3. Allocations
    unsubs.push(
      wsClient.subscribe(
        "portfolio_balance_allocations",
        { type: "get_portfolio_balance_allocations", data: {} },
        (rawPayload, fullMsg) => {
          const raw = fullMsg?.data?.data ?? fullMsg?.data ?? rawPayload;
          if (raw && (raw.totalValue !== undefined || raw.allocations)) {
            wsHasDataRef.current = true;
            if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
            setData((prev) => ({
              ...prev,
              allocations: {
                totalValue: raw.totalValue ?? "0",
                allocations: Array.isArray(raw.allocations) ? raw.allocations : [],
              },
              isAllocationsLoading: false,
            }));
          }
        }
      )
    );

    // 4. Margin Account
    unsubs.push(
      wsClient.subscribe(
        "margin_account",
        { type: "get_margin_account", data: {} },
        (rawPayload, fullMsg) => {
          const raw = fullMsg?.data?.data ?? fullMsg?.data ?? rawPayload;
          if (raw && raw.assets) {
            setData((prev) => ({
              ...prev,
              marginAccount: raw as MarginAccountData,
            }));
          }
        }
      )
    );

    // 5. Futures Positions
    unsubs.push(
      wsClient.subscribe(
        "futures_positions",
        { type: "get_futures_positions", data: {} },
        (rawPayload, fullMsg) => {
          const raw = fullMsg?.data?.data ?? fullMsg?.data ?? rawPayload;
          if (Array.isArray(raw)) {
            setData((prev) => ({
              ...prev,
              futuresPositions: raw,
            }));
          }
        }
      )
    );

    return () => {
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      unsubscribeStatus();
      unsubs.forEach((unsub) => unsub());
    };
  }, [applyHttpFallbackData]);

  // Always expose refreshBalances directly so callers don't rely on stale state
  return { ...data, refreshBalances };
};