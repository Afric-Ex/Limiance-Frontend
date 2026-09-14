"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCookie } from "cookies-next";
import { api } from "@/src/lib/axios";

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

/** Derive per-account USD totals from per-coin portfolio data */
function deriveAccountBalances(coins: any[]): Record<string, AccountBalance> {
  const totals: Record<string, number> = { spot: 0, funding: 0, futures: 0, margin: 0 };

  coins.forEach(c => {
    const price = parseFloat(c.currencyPrice || c.usdPrice || c.price || "0");
    const spot = parseFloat(c.spotBalance || c.spot_balance || c.balance || c.free || "0");
    const funding = parseFloat(c.fundingBalance || c.funding_balance || "0");
    const futures = parseFloat(c.futuresBalance || c.futures_balance || "0");
    const margin = parseFloat(c.marginBalance || c.margin_balance || "0");

    totals.spot    += spot    * price;
    totals.funding += funding * price;
    totals.futures += futures * price;
    totals.margin  += margin  * price;
  });

  const btcCoin = coins.find((c) => c.symbol === "BTC");
  const btcPrice = parseFloat(btcCoin?.currencyPrice || btcCoin?.price || "1") || 1;

  const makeBalance = (usd: number): AccountBalance => ({
    inUsd: usd.toFixed(8),
    inBtc: (usd / btcPrice).toFixed(8),
    inNgn: (usd * 1600).toFixed(2),
    pnl: "0",
    pnlPercentage: "0",
  });

  return {
    spot:    makeBalance(totals.spot),
    funding: makeBalance(totals.funding),
    futures: makeBalance(totals.futures),
    margin:  makeBalance(totals.margin),
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

      if (portfolioRes.status === "fulfilled" && portfolioRes.value.data?.data) {
        result.coins = portfolioRes.value.data.data;
      } else if (portfolioRes.status === "fulfilled" && Array.isArray(portfolioRes.value.data)) {
        result.coins = portfolioRes.value.data;
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

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // refreshBalances always uses WS when connected, HTTP otherwise
  const refreshBalances = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "get_portfolio", data: { page: "1", limit: "100", query: "" } }));
      ws.send(JSON.stringify({ type: "get_portfolio_balance_allocations", data: {} }));
      ws.send(JSON.stringify({ type: "get_portfolio_balance", data: {} }));
      ws.send(JSON.stringify({ type: "get_margin_account", data: {} }));
      ws.send(JSON.stringify({ type: "get_futures_positions", data: {} }));
    } else {
      // WS not ready — fall back to HTTP
      applyHttpFallbackData();
    }
  }, [applyHttpFallbackData]);

  const connectWs = useCallback(() => {
    const token = getCookie("auth-token");
    if (!token) {
      // No auth token — go straight to HTTP
      applyHttpFallbackData();
      return;
    }

    const explicitUrl = process.env.NEXT_PUBLIC_WS_URL;
    const isHttps = window.location.protocol === "https:";
    const proto = isHttps ? "wss:" : "ws:";
    const rawUrl = explicitUrl || `${proto}//${window.location.host}/ws-proxy`;
    const safeUrl = isHttps ? rawUrl.replace(/^ws:\/\//, "wss://") : rawUrl;

    // If WS doesn't deliver data within 5s, fall back to HTTP
    if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
    wsTimeoutRef.current = setTimeout(() => {
      if (!wsHasDataRef.current) {
        console.warn("[portfolio-ws] WS slow/failed — loading HTTP fallback");
        applyHttpFallbackData();
      }
    }, 5000);

    const ws = new WebSocket(`${safeUrl}?auth-token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      setData((prev) => ({ ...prev, isConnected: true }));
      // Request all data over WS immediately on connect
      ws.send(JSON.stringify({ type: "get_portfolio", data: { page: "1", limit: "100", query: "" } }));
      ws.send(JSON.stringify({ type: "get_portfolio_balance_allocations", data: {} }));
      ws.send(JSON.stringify({ type: "get_portfolio_balance", data: {} }));
      ws.send(JSON.stringify({ type: "get_margin_account", data: {} }));
      ws.send(JSON.stringify({ type: "get_futures_positions", data: {} }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Portfolio coins -> derive per-account balance breakdowns
        if (msg.type === "portfolio" || msg.type === "get_portfolio") {
          const items: PortfolioCoin[] = Array.isArray(msg.data?.data)
            ? msg.data.data
            : Array.isArray(msg.data)
            ? msg.data
            : [];
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

        // Total portfolio balance from backend
        if (msg.type === "portfolio_balance" || msg.type === "get_portfolio_balance") {
          const raw = msg.data?.data ?? msg.data;
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

        // Allocations
        if (
          msg.type === "portfolio_balance_allocations" ||
          msg.type === "get_portfolio_balance_allocations" ||
          msg.type === "balance_allocations"
        ) {
          const raw = msg.data?.data ?? msg.data ?? msg;
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

        // Margin Account
        if (msg.type === "margin_account" || msg.type === "get_margin_account") {
          const raw = msg.data?.data ?? msg.data;
          if (raw && raw.assets) {
            setData((prev) => ({
              ...prev,
              marginAccount: raw as MarginAccountData,
            }));
          }
        }

        // Futures Positions
        if (msg.type === "futures_positions" || msg.type === "get_futures_positions") {
          const raw = msg.data?.data ?? msg.data;
          if (Array.isArray(raw)) {
            setData((prev) => ({
              ...prev,
              futuresPositions: raw,
            }));
          }
        }
      } catch {
        // ignore bad/malformed messages
      }
    };

    ws.onclose = () => {
      setData((prev) => ({ ...prev, isConnected: false }));
      // Only fall back to HTTP if WS never delivered data (don't overwrite live data with stale HTTP)
      if (!wsHasDataRef.current) {
        applyHttpFallbackData();
      }
      // Exponential backoff reconnect: 2s → 4s → 8s → max 30s
      const backoff = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(connectWs, backoff);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [refreshBalances, applyHttpFallbackData]);

  useEffect(() => {
    // WS first — HTTP is only triggered by timeout or WS failure
    connectWs();
    return () => {
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  // Always expose refreshBalances directly so callers don't rely on stale state
  return { ...data, refreshBalances };
};