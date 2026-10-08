"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/src/lib/axios";
import { wsClient } from "@/src/lib/websocket-client";

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

export const useMarketFeed = (pair: string): MarketFeedData => {
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

  const fetchHttpFallback = useCallback(async () => {
    const now = Date.now();
    if (now - lastFallbackAt.current < 30_000) return; // throttle: max once per 30s
    // Don't hit REST while the socket is healthy and already pushing this pair —
    // that just burns a request for data we are about to receive anyway.
    if (wsClient.getIsConnected()) return;
    lastFallbackAt.current = now;

    try {
      const normalisedPair = pair.replace("/", "-").toUpperCase();
      const res = await api.get("trading/24_hours_movers", { params: { limit: 100 } });
      const items: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      const match = items.find(
        (m: any) => (m.symbol || m.pair || "").replace("/", "-").toUpperCase() === normalisedPair
      );

      setData((prev) => ({
        ...prev,
        price: match ? parseFloat(match.last_price ?? match.lastPrice ?? match.price ?? "0") : prev.price,
        change24h: match ? parseFloat(match.price_change ?? match.priceChange ?? match.change24h ?? "0") : prev.change24h,
        changePercent24h: match ? parseFloat(match.percent_change ?? match.priceChangePercent ?? match.changePercent24h ?? "0") : prev.changePercent24h,
        high24h: match ? parseFloat(match.high_24h ?? match.highPrice ?? "0") : prev.high24h,
        low24h: match ? parseFloat(match.low_24h ?? match.lowPrice ?? "0") : prev.low24h,
        volume24h: match ? parseFloat(match.volume ?? match.volume24h ?? "0") : prev.volume24h,
        lastUpdated: new Date(),
        markets: items,
        marketsLoading: false,
      }));
    } catch {
      // Feed falls back to the last known values; nothing to surface here.
    } finally {
      setData((prev) => ({ ...prev, marketsLoading: false }));
    }
  }, [pair]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    fetchHttpFallback();

    const normalisedPair = pair.replace("/", "-").toUpperCase();
    // The feed streams every market on this topic, so the server no longer
    // needs the pair in the request: filtering happens client-side below.
    const payload = { type: "get_market_data" };

    // Attached only while this screen is mounted, so a market feed can't keep
    // the socket alive on pages that show no prices.
    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected) fetchHttpFallback();
    });

    const unsubscribeMessages = wsClient.subscribe(
      "spot_margin_markets",
      payload,
      (dataPayload) => {
        const items: any[] = Array.isArray(dataPayload?.data) ? dataPayload.data : [];
        const match = items.find(
          (m) => (m.symbol || m.pair || "").replace("/", "-").toUpperCase() === normalisedPair
        );

        setData((prev) => ({
          ...prev,
          price: match?.last_price ?? match?.lastPrice ?? match?.price ?? prev.price,
          change24h: match?.price_change ?? match?.priceChange ?? match?.change24h ?? prev.change24h,
          changePercent24h: match?.percent_change ?? match?.priceChangePercent ?? match?.changePercent24h ?? prev.changePercent24h,
          high24h: match?.high_24h ?? match?.highPrice ?? match?.high24h ?? prev.high24h,
          low24h: match?.low_24h ?? match?.lowPrice ?? match?.low24h ?? prev.low24h,
          volume24h: match?.volume ?? match?.volume24h ?? prev.volume24h,
          fundingRate: match?.funding_rate ?? match?.fundingRate ?? prev.fundingRate,
          nextFundingTime: match?.next_funding_time ?? prev.nextFundingTime,
          isConnected: true,
          lastUpdated: new Date(),
          markets: items,
          marketsLoading: false,
        }));
      }
    );

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, [pair, fetchHttpFallback]);

  return data;
};
