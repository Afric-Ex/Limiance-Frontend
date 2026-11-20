"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/src/lib/axios";
import { wsClient } from "@/src/lib/websocket-client";
import { fallbackIfSocketStaysDown } from "@/src/lib/ws-fallback";

interface MarketItem {
  symbol: string;
  base: string;
  quote: string;
  last_price: number;
  price_change: number;
  percent_change: number;
  volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
  funding_rate?: number;
  next_funding_time?: string;
  // Fallback API properties
  lastPrice?: number;
  price?: number;
  priceChange?: number;
  change24h?: number;
  priceChangePercent?: number;
  changePercent24h?: number;
  highPrice?: number;
  lowPrice?: number;
  volume24h?: number;
  quoteVolume?: number;
  pair?: string;
  fundingRate?: number;
}

interface MarketFeedData {
  price: number | null;
  change24h: number | null;
  changePercent24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  fundingRate: number | null;
  nextFundingTime: string | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  markets: MarketItem[];
  marketsLoading: boolean;
}

export type MarketFeedMarket = "spot" | "margin" | "futures";

/** Pair comparison ignores separators so "BTC/USDT", "BTC-USDT" and "BTCUSDT" match. */
const normalizePairKey = (value: unknown) =>
  String(value ?? "").replace(/[/\\\-_:\s]/g, "").toUpperCase();

/**
 * Normalised market key with a trailing market-type tag stripped, so a ticker
 * tagged "BTCUSDT:spot", "BTCUSDTSPOT" or a "BTC-PERP" symbol still compares
 * equal to the "BTC/USDT" pair it represents.
 */
const normalizeMarketKey = (value: unknown) =>
  normalizePairKey(value).replace(/(?:SPOT|MARGIN|FUTURES|PERP|PERPETUAL|SWAP)$/, "");

/** The pair spelling the funding-rate stream expects ("BTC/USDT"). */
const canonicalPair = (value: string) => {
  const raw = String(value ?? "").trim().toUpperCase();
  const parts = raw.split(/[\/\-_:\s]+/).filter(Boolean);
  return parts.length === 2 ? `${parts[0]}/${parts[1]}` : raw;
};

/**
 * Pull the ticker array out of any of the envelopes the market streams use:
 * `{ data: [...] }`, `{ markets: [...] }`, a bare array, or a single ticker
 * object pushed as `market_data` / `futures_markets`.
 */
function extractMarketItems(raw: unknown, depth = 0): any[] {
  if (!raw || depth > 4) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const direct =
    record.markets ?? record.tickers ?? record.ticker ?? record.market ?? record.futures ?? record.Data;
  if (Array.isArray(direct)) return direct;
  const data = record.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nested = extractMarketItems(data, depth + 1);
    if (nested.length > 0) return nested;
  }
  if (record.symbol !== undefined || record.pair !== undefined) return [record];
  return [];
}

const positiveOrPrev = (val: unknown, prev: number | null): number | null => {
  if (val === null || val === undefined || val === "") return prev;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : prev;
};

/** Selected-pair ticker from a ticker list, separator-insensitive. */
function findMarket(items: any[], pair: string): any | undefined {
  const target = normalizeMarketKey(pair);
  return items.find((item) => {
    if (!item || typeof item !== "object") return false;
    const base = item.base ?? item.baseAsset;
    const quote = item.quote ?? item.quoteAsset;
    const candidates = [
      item.symbol,
      item.pair,
      item.tradingPair,
      item.trading_pair,
      base && quote ? `${base}/${quote}` : undefined,
    ];
    return candidates.some(
      (candidate) => candidate != null && normalizeMarketKey(candidate) === target
    );
  });
}

export const useMarketFeed = (
  pair: string,
  market: MarketFeedMarket = "spot"
): MarketFeedData => {
  const [data, setData] = useState<MarketFeedData>({
    price: null,
    change24h: null,
    changePercent24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    fundingRate: null,
    nextFundingTime: null,
    isConnected: false,
    lastUpdated: null,
    markets: [],
    marketsLoading: true,
  });

  // Throttle the HTTP fallback so it fires at most once every 30 seconds.
  // The WS disconnect handler fires on every reconnect attempt (backoff schedule),
  // which can hammer the endpoint and hit a backend account-status check failure.
  const lastFallbackAt = useRef<number>(0);

  const fetchHttpFallback = useCallback(
    async (options?: { force?: boolean; statsOnly?: boolean }) => {
      const force = options?.force === true;
      const statsOnly = options?.statsOnly === true;
      const now = Date.now();
      if (!force && now - lastFallbackAt.current < 30_000) return; // throttle: max once per 30s
      // Don't hit REST while the socket is healthy and already pushing this pair —
      // that just burns a request for data we are about to receive anyway. A forced
      // call (the 24h stats seed) is an explicit exception.
      if (!force && wsClient.getIsConnected()) return;
      lastFallbackAt.current = now;

      try {
        const endpoint = market === "futures" ? "trading/futures/markets" : "trading/24_hours_movers";
        const res = await api.get(endpoint, { params: { limit: 100 } });
        const items: any[] = extractMarketItems(res.data);
        const match = findMarket(items, pair);

        setData((prev) => ({
          ...prev,
          price:
            statsOnly || !match
              ? prev.price
              : positiveOrPrev(
                  match.mark_price ?? match.markPrice ?? match.last_price ?? match.lastPrice ?? match.price,
                  prev.price
                ),
          change24h: match
            ? Number(match.price_change_24h ?? match.price_change ?? match.priceChange ?? match.change24h ?? prev.change24h ?? 0)
            : prev.change24h,
          changePercent24h: match
            ? Number(match.change_percent_24h ?? match.percent_change ?? match.priceChangePercent ?? match.changePercent24h ?? prev.changePercent24h ?? 0)
            : prev.changePercent24h,
          high24h: match ? positiveOrPrev(match.high_24h ?? match.highPrice ?? match.high24h, prev.high24h) : prev.high24h,
          low24h: match ? positiveOrPrev(match.low_24h ?? match.lowPrice ?? match.low24h, prev.low24h) : prev.low24h,
          volume24h: match ? Number(match.volume_24h ?? match.volume ?? match.volume24h ?? prev.volume24h ?? 0) : prev.volume24h,
          fundingRate:
            market === "futures" && match
              ? Number(match.funding_rate ?? match.fundingRate ?? prev.fundingRate ?? 0)
              : prev.fundingRate,
          nextFundingTime:
            market === "futures" && match
              ? match.next_funding_time ?? match.nextFundingTime ?? prev.nextFundingTime
              : prev.nextFundingTime,
          lastUpdated: new Date(),
          markets: items.length > 0 && market !== "futures" ? (items as MarketItem[]) : prev.markets,
          marketsLoading: false,
        }));
      } catch {
        // Feed falls back to the last known values; nothing to surface here.
      } finally {
        setData((prev) => ({ ...prev, marketsLoading: false }));
      }
    },
    [pair, market]
  );

  // The market-wide WS ticker does not always surface the selected pair's 24h
  // stats (and never carries high/low on futures), which left the pair header's
  // 24H fields blank. Seed them from REST and keep them fresh; WS snapshots still
  // overwrite these whenever the pair is present. `statsOnly` leaves the live
  // price/mark untouched.
  useEffect(() => {
    const seed = () => void fetchHttpFallback({ force: true, statsOnly: true });
    const timer = setTimeout(seed, 1500);
    const interval = setInterval(seed, 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchHttpFallback]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    // HTTP only if the socket stays down past the grace period (connecting != failed).
    const cancelGraceFallback = fallbackIfSocketStaysDown(fetchHttpFallback);
    let sawConnected = false;

    // The spot/margin feed streams every market on this topic, so the server
    // no longer needs the pair in the request: filtering happens client-side.
    const marketDataRequest = { type: "get_market_data", data: {} };

    // Attached only while this screen is mounted, so a market feed can't keep
    // the socket alive on pages that show no prices.
    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (connected) {
        sawConnected = true;
        return;
      }
      // Only a real drop (was connected, now closed) goes to HTTP straight away.
      // The initial "not connected yet" replay is handled by the grace timer.
      if (sawConnected) fetchHttpFallback();
    });

    const applyMarkets = (dataPayload: any) => {
      const items = extractMarketItems(dataPayload);
      if (items.length === 0) return;
      const match = findMarket(items, pair);

      setData((prev) => ({
        ...prev,
        // Futures prices come from the dedicated futures ticker/funding streams
        // below, so the spot/margin snapshot only supplies the pair list there.
        price:
          market === "futures"
            ? prev.price
            : match?.last_price ?? match?.lastPrice ?? match?.price ?? prev.price,
        change24h:
          market === "futures"
            ? prev.change24h
            : match?.price_change ?? match?.priceChange ?? match?.change24h ?? prev.change24h,
        changePercent24h:
          market === "futures"
            ? prev.changePercent24h
            : match?.percent_change ?? match?.priceChangePercent ?? match?.changePercent24h ?? prev.changePercent24h,
        high24h:
          market === "futures"
            ? prev.high24h
            : match?.high_24h ?? match?.highPrice ?? match?.high24h ?? prev.high24h,
        low24h:
          market === "futures"
            ? prev.low24h
            : match?.low_24h ?? match?.lowPrice ?? match?.low24h ?? prev.low24h,
        volume24h:
          market === "futures"
            ? prev.volume24h
            : match?.volume ?? match?.volume24h ?? prev.volume24h,
        fundingRate:
          market === "futures" ? prev.fundingRate : match?.funding_rate ?? match?.fundingRate ?? prev.fundingRate,
        nextFundingTime:
          market === "futures" ? prev.nextFundingTime : match?.next_funding_time ?? prev.nextFundingTime,
        isConnected: true,
        lastUpdated: new Date(),
        markets: items as MarketItem[],
        marketsLoading: false,
      }));
    };

    // One request frame per stream: the primary topic carries the payload and
    // the alias topics are listeners only, so a reconnect re-sends each request
    // exactly once instead of once per documented response type.
    const unsubscribes: Array<() => void> = [
      wsClient.subscribe("market_data", marketDataRequest, applyMarkets),
      // Deployed backend pushes tickers on `spot_margin_markets`; the docs call
      // the same stream `market_data`. Listen to both.
      wsClient.subscribe("spot_margin_markets", null, applyMarkets),
      wsClient.subscribe("spot_margin_stream_started", null, applyMarkets),
    ];

    if (market === "futures") {
      // §5.12: mark/index price, 24h stats and open interest for every perp.
      unsubscribes.push(
        wsClient.subscribe("futures_markets", { type: "get_futures_markets", data: {} }, (dataPayload) => {
          const items = extractMarketItems(dataPayload);
          if (items.length === 0) return;
          const match = findMarket(items, pair);

          setData((prev) => ({
            ...prev,
            price: (() => {
              const n = Number(match?.markPrice ?? match?.mark_price ?? match?.last_price ?? match?.lastPrice ?? match?.price);
              return Number.isFinite(n) && n > 0 ? n : prev.price;
            })(),
            change24h:
              match?.priceChange ??
              match?.price_change ??
              match?.price_change_24h ??
              match?.change24h ??
              (match?.priceChangePercent != null && match?.lastPrice != null
                ? (Number(match.lastPrice) * Number(match.priceChangePercent)) / 100
                : prev.change24h),
            changePercent24h:
              match?.priceChangePercent ??
              match?.priceChangePercent24h ??
              match?.price_change_percent ??
              match?.percent_change ??
              match?.change_percent_24h ??
              match?.changePercent24h ??
              prev.changePercent24h,
            high24h: positiveOrPrev(match?.high_24h ?? match?.highPrice ?? match?.high24h, prev.high24h),
            low24h: positiveOrPrev(match?.low_24h ?? match?.lowPrice ?? match?.low24h, prev.low24h),
            volume24h: match?.volume24h ?? match?.volume_24h ?? match?.volume ?? prev.volume24h,
            fundingRate: match?.fundingRate ?? match?.funding_rate ?? prev.fundingRate,
            nextFundingTime:
              match?.nextFundingTime ?? match?.next_funding_time ?? prev.nextFundingTime,
            // Keep the pair list from the market-wide feed; futures tickers use a
            // compact symbol and do not carry base/quote for the pair selector.
            isConnected: true,
            lastUpdated: new Date(),
            marketsLoading: false,
          }));
        })
      );

      // §5.11: funding rate + countdown for the selected pair.
      unsubscribes.push(
        wsClient.subscribe(
          "funding_rate",
          { type: "get_funding_rate", data: { pair: canonicalPair(pair) } },
          (dataPayload) => {
            const source = dataPayload?.data && typeof dataPayload.data === "object"
              ? dataPayload.data
              : dataPayload;
            if (!source) return;
            const streamPair = source.pair ?? source.symbol ?? dataPayload?.pair;
            if (streamPair && normalizePairKey(streamPair) !== normalizePairKey(pair)) return;

            const rawRate = Number(source.rate ?? source.fundingRate ?? source.funding_rate);
            setData((prev) => ({
              ...prev,
              fundingRate: Number.isFinite(rawRate) ? rawRate : prev.fundingRate,
              nextFundingTime:
                source.nextFundingTime ?? source.next_funding_time ?? prev.nextFundingTime,
              lastUpdated: new Date(),
            }));
          }
        )
      );
    }

    return () => {
      cancelGraceFallback();
      unsubscribeStatus();
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [pair, market, fetchHttpFallback]);

  return data;
};
