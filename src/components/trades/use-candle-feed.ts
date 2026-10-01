"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { wsClient } from "@/src/lib/websocket-client";
import type { KlineCandle } from "@/src/types/trading";

export type ChartMarket = "spot" | "margin" | "futures";

// Normalize any pair spelling ("BTC/USDT", "BTC-USDT", "BTCUSDT") to one key.
const pairKey = (v: string) => String(v ?? "").replace(/[/\\\-_\s]/g, "").toUpperCase();

// Backend WS candle stream request types per market.
const MARKET_CANDLE_REQUEST: Partial<Record<ChartMarket, string>> = {
  spot: "get_spot_candles",
  margin: "get_margin_candles",
  futures: "get_futures_candles",
};

// The pair string each market's WS candle stream expects to receive:
//   spot    → "BTC-USDT"  (dashed, verified live)
//   margin  → "BTC/USDT"  (dashed with slash — compact BTCUSDT makes the stream
//                          error with "Error receiving OHLC data")
//   futures → "BTCUSDT"   (compact, per confirmed backend shape)
const MARKET_WS_PAIR: Record<ChartMarket, (symbol: string) => string> = {
  spot: (s) => s.replace("/", "-").toUpperCase(),
  margin: (s) => s,
  futures: (s) => pairKey(s),
};

interface LiveCandle extends KlineCandle {
  symbol: string;
  interval: string;
  closed: boolean;
}

function toLiveCandle(c: any): LiveCandle | null {
  if (!c || !Number.isFinite(Number(c.o))) return null;
  const rawTime = Number(c.t);
  return {
    time: Number.isFinite(rawTime) && rawTime > 0 && rawTime < 1e12 ? rawTime * 1000 : rawTime,
    open: Number(c.o),
    high: Number(c.h),
    low: Number(c.l),
    close: Number(c.c),
    volume: Number(c.v),
    symbol: String(c.s ?? ""),
    interval: String(c.i ?? ""),
    closed: c.x === true,
  };
}

// ── Backend kline normalisation ──────────────────────────────────────────────
// Accepts response envelopes of {Data:[...]}, {data:[...]}, {result:[...]} or raw arrays,
// and candles as either objects ({t,o,c,h,l,v} / {time,open,high,low,close,volume}) or Binance-style arrays.
const SLICE_VARIANTS = ["Data", "data", "result", "klines", "candles"] as const;

function unwrapKlines(raw: any): any[] {
  let value = raw;
  for (let i = 0; i < 2; i++) {
    if (value && typeof value === "object") {
      const inner = value?.data;
      if (Array.isArray(inner)) return inner;
      const found = SLICE_VARIANTS.find((k) => Array.isArray(value?.[k]));
      if (found) return value[found];
      if (typeof inner === "object" && inner !== null) value = inner;
      else break;
    }
  }
  return Array.isArray(value) ? value : [];
}

function normalizeKlines(raw: any): KlineCandle[] {
  return unwrapKlines(raw)
    .map((c: any): KlineCandle | null => {
      if (Array.isArray(c)) {
        const [time, open, high, low, close, volume] = c;
        if (typeof open === "string" && open.includes(":")) return null; // header row guard
        if (!Number.isFinite(Number(open))) return null;
        return {
          time: Number(time ?? 0) * (Number(time) < 1e12 ? 1000 : 1),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume ?? 0),
        };
      }
      if (c === null || typeof c !== "object") return null;
      if (!Number.isFinite(Number(c.open ?? c.o))) return null;
      const rawTime = Number(c.time ?? c.t ?? c.openTime ?? c.open_time ?? c.timestamp);
      const time =
        Number.isFinite(rawTime) && rawTime > 0 && rawTime < 1e12 ? rawTime * 1000 : rawTime;
      return {
        time,
        open: Number(c.open ?? c.o),
        high: Number(c.high ?? c.h),
        low: Number(c.low ?? c.l),
        close: Number(c.close ?? c.c),
        volume: Number(c.volume ?? c.v ?? 0),
      };
    })
    .filter((c): c is KlineCandle => c !== null && Number.isFinite(c.open) && Number.isFinite(c.close))
    .sort((a, b) => a.time - b.time);
}

export interface CandleFeed {
  /** History merged with live WS candles, ascending by time. */
  candles: KlineCandle[];
  isLoading: boolean;
  isError: boolean;
  /** True while the socket is up but no candle has arrived for this pair/interval. */
  wsPending: boolean;
}

/**
 * REST history for the klines plus the incremental WS candle stream, merged.
 * Shared by every chart engine so a visual A/B compares rendering only.
 */
export function useCandleFeed(symbol: string, interval: string, market: ChartMarket): CandleFeed {
  const candleRequest = MARKET_CANDLE_REQUEST[market];

  const [wsReady, setWsReady] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [restFallback, setRestFallback] = useState(false);

  const { data: historyCandles, isLoading, isError } = useQuery({
    queryKey: tradingKeys.klineData(symbol, interval, market),
    queryFn: () => tradingService.klineData({ symbol, interval, limit: 1000, market }),
    select: (res) => normalizeKlines(res),
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
    // Load history while the socket is down, while no WS candle has arrived
    // yet for this pair/interval, or after the WS fell back to REST.
    enabled: !wsConnected || !wsReady || restFallback,
  });

  // liveCandles only tracks the incremental WS updates; history is merged in
  // at render time so it always appears regardless of arrival order.
  const [liveCandles, setLiveCandles] = useState<KlineCandle[] | null>(null);

  // Reset the live buffer whenever the pair or interval changes
  useEffect(() => {
    setLiveCandles(null);
    setWsReady(false);
    setRestFallback(false);
  }, [symbol, interval]);

  // Track whether the shared socket is up. Only while this chart is mounted —
  // the status listener used to be permanent, so a closed chart still held the
  // connection open.
  useEffect(() => wsClient.onStatusChange(setWsConnected), []);

  // Fall back to HTTP whenever the socket is not connected, and while it is
  // connected wait briefly for the candle stream; if it never answers, use
  // HTTP so the chart still has history. Markets with no candle WS stream
  // (futures) always go through REST.
  useEffect(() => {
    if (!candleRequest) {
      setRestFallback(true);
      return;
    }
    if (wsReady) {
      setRestFallback(false);
      return;
    }
    if (!wsConnected) {
      setRestFallback(true);
      return;
    }
    setRestFallback(false);
    const timer = setTimeout(() => setRestFallback(true), 5000);
    return () => clearTimeout(timer);
  }, [candleRequest, wsConnected, wsReady]);

  const wsPair = MARKET_WS_PAIR[market](symbol);

  useEffect(() => {
    if (!candleRequest) return;
    const payload = { type: candleRequest, data: { pair: wsPair, interval } };
    const unsubscribe = wsClient.subscribe("candle", payload, (data) => {
      const rawCandles = data?.candles;
      if (!Array.isArray(rawCandles) || rawCandles.length === 0) return;
      const incoming = rawCandles.map(toLiveCandle).filter((c): c is LiveCandle => c !== null);
      if (incoming.length === 0) return;
      // Candles tagged with a different pair/interval belong to another subscription.
      const matched = incoming.filter(
        (c) =>
          (!c.symbol || pairKey(c.symbol) === pairKey(symbol)) &&
          (!c.interval || c.interval === interval)
      );
      if (matched.length === 0) return;
      setWsReady(true);
      setRestFallback(false);
      setLiveCandles((prev) => {
        const base = prev && prev.length > 0 ? prev : [];
        const next = [...base];
        for (const candle of matched) {
          const idx = next.findIndex((k) => k.time === candle.time);
          if (idx >= 0) next[idx] = candle;
          else next.push(candle);
        }
        return next.sort((a, b) => a.time - b.time);
      });
    });
    return unsubscribe;
  }, [candleRequest, wsPair, interval, symbol]);

  const candles = useMemo(() => {
    const base = historyCandles ?? [];
    if (!liveCandles || liveCandles.length === 0) return base;
    const byTime = new Map(base.map((c) => [c.time, c]));
    for (const c of liveCandles) byTime.set(c.time, c);
    return [...byTime.values()].sort((a, b) => a.time - b.time);
  }, [historyCandles, liveCandles]);

  return {
    candles,
    isLoading,
    isError,
    wsPending: !wsReady && !restFallback && !isLoading && candles.length === 0,
  };
}
