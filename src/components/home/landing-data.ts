"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/src/stores/user-store";

/**
 * Public market data for the landing page.
 *
 * Uses a plain same-origin fetch to the app's /proxy rewrite instead of the shared
 * axios client: that client's 401 interceptor logs the user out and redirects to
 * /auth/login, which must never happen to a visitor browsing the landing page.
 * Anything that fails here simply renders its empty state. Nothing is invented.
 */

export type Pair = { symbol: string; price: number; changePct: number; prev: number | null };
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export const INTERVALS = ["15m", "1h", "4h"] as const;
export type Interval = (typeof INTERVALS)[number];
export const DEFAULT_PAIR = "BTC/USDT";

async function getJson(path: string, params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const res = await fetch(`/proxy/${path}${qs ? `?${qs}` : ""}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

function toPair(r: any): Pair | null {
  const symbol = r?.pair ?? r?.symbol;
  const price = num(r?.latest_price ?? r?.last_price);
  const changePct = num(r?.percent_change_24h ?? r?.percent_change);
  if (typeof symbol !== "string" || price === null || changePct === null) return null;
  return { symbol, price, changePct, prev: num(r?.price_24h_ago) };
}

const list = (v: unknown): Pair[] =>
  Array.isArray(v) ? v.map(toPair).filter((p): p is Pair => p !== null) : [];

export function useMovers() {
  return useQuery({
    queryKey: ["landing", "movers"],
    queryFn: async () => {
      const json = await getJson("trading/24_hours_movers", { limit: 100 });
      const d = json?.data ?? json?.Data;
      const flat = Array.isArray(d) ? list(d) : null;
      const gainers = flat ? flat.filter((p) => p.changePct >= 0) : list(d?.gainers);
      const losers = flat ? flat.filter((p) => p.changePct < 0) : list(d?.losers);
      const seen = new Set<string>();
      const all = [...gainers, ...losers]
        .filter((p) => !seen.has(p.symbol) && !!seen.add(p.symbol))
        .sort((a, b) => b.changePct - a.changePct);
      return { gainers, losers, all };
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: false,
  });
}

export function useCandles(symbol: string, interval: Interval) {
  return useQuery({
    queryKey: ["landing", "candles", symbol, interval],
    queryFn: async (): Promise<Candle[]> => {
      const json = await getJson("trading/kline/historical", { symbol, interval, limit: 120 });
      const rows = json?.Data ?? json?.data;
      if (!Array.isArray(rows)) throw new Error("no candles");
      const byTime = new Map<number, Candle>();
      for (const r of rows) {
        const t = num(r?.t ?? r?.time);
        const open = num(r?.o ?? r?.open), high = num(r?.h ?? r?.high);
        const low = num(r?.l ?? r?.low), close = num(r?.c ?? r?.close);
        if (t === null || open === null || high === null || low === null || close === null) continue;
        const time = Math.floor(t > 1e12 ? t / 1000 : t);
        byTime.set(time, { time, open, high, low, close, volume: num(r?.v ?? r?.volume) ?? 0 });
      }
      const out = [...byTime.values()].sort((a, b) => a.time - b.time);
      if (out.length === 0) throw new Error("no candles");
      return out;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    retry: false,
  });
}

export const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: n >= 1000 ? 2 : 0,
    maximumFractionDigits: n >= 1000 ? 2 : n >= 1 ? 4 : 8,
  }).format(n);

export const fmtPct = (n: number) => `${n >= 0 ? "+" : "\u2212"}${Math.abs(n).toFixed(2)}%`;

/** Where the primary calls to action should go for this visitor. */
export function useCta() {
  const user = useUserStore((s) => s.user);
  return user
    ? { primary: { href: "/dashboard", label: "Open dashboard" }, trade: { href: "/trades/spot", label: "Trade" } }
    : { primary: { href: "/auth/signup", label: "Create account" }, trade: { href: "/auth/signup", label: "Trade" } };
}