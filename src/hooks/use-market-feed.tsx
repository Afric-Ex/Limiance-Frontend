"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCookie } from "cookies-next";
import { api } from "@/src/lib/axios";
import { MOCK_MODE } from "@/src/mocks";
import { MOCK_PRICES } from "@/src/mocks/data/market-data";

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
  });

  const fetchHttpFallback = useCallback(async () => {
    try {
      const normalisedPair = pair.replace("/", "-").toUpperCase();
      const res = await api.get("trading/24_hours_movers", { params: { limit: 100 } });
      const items = res.data?.data || [];
      const match = items.find(
        (m: any) => (m.symbol || m.pair || "").replace("/", "-").toUpperCase() === normalisedPair
      );

      setData(prev => ({
        ...prev,
        isConnected: false,
        price: match ? parseFloat(match.last_price ?? match.lastPrice ?? match.price ?? "0") : prev.price,
        change24h: match ? parseFloat(match.price_change ?? match.priceChange ?? match.change24h ?? "0") : prev.change24h,
        changePercent24h: match ? parseFloat(match.percent_change ?? match.priceChangePercent ?? match.changePercent24h ?? "0") : prev.changePercent24h,
        high24h: match ? parseFloat(match.high_24h ?? match.highPrice ?? "0") : prev.high24h,
        low24h: match ? parseFloat(match.low_24h ?? match.lowPrice ?? "0") : prev.low24h,
        volume24h: match ? parseFloat(match.volume ?? match.volume24h ?? "0") : prev.volume24h,
        lastUpdated: new Date(),
        markets: items,
      }));
    } catch (err) {
      console.error("HTTP fallback for market feed failed", err);
    }
  }, [pair]);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- mock mode: simulate live feed with setInterval ---
  useEffect(() => {
    if (!MOCK_MODE.marketFeed) return;

    const base = MOCK_PRICES[pair];
    if (!base) return;

    setData({
      price: base.price,
      change24h: base.change24h,
      changePercent24h: base.changePercent24h,
      high24h: base.high24h,
      low24h: base.low24h,
      volume24h: base.volume24h,
      fundingRate: null,
      nextFundingTime: null,
      isConnected: true,
      lastUpdated: new Date(),
      markets: [],
    });

    const interval = setInterval(() => {
      setData((prev) => {
        const currentPrice = prev.price ?? base.price;
        // ±0.1% random drift
        const drift = currentPrice * (Math.random() - 0.5) * 0.002;
        const newPrice = +(currentPrice + drift).toFixed(
          currentPrice > 100 ? 2 : 4
        );
        return {
          ...prev,
          price: newPrice,
          change24h: +(newPrice - (base.price - base.change24h)).toFixed(2),
          changePercent24h: +(
            ((newPrice - (base.price - base.change24h)) /
              (base.price - base.change24h)) *
            100
          ).toFixed(2),
          lastUpdated: new Date(),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pair]);

  // --- real mode: WebSocket with exponential backoff ---
  const connectWs = useCallback(() => {
    if (MOCK_MODE.marketFeed) return;

    const token = getCookie("auth-token");
    const explicitUrl = process.env.NEXT_PUBLIC_WS_URL;
    const isHttps = window.location.protocol === "https:";
    const proto = isHttps ? "wss:" : "ws:";

    // Auto-upgrade ws:// → wss:// when on HTTPS (Nginx terminates SSL)
    const rawUrl = explicitUrl || `${proto}//${window.location.host}/ws-proxy`;
    const safeUrl = isHttps ? rawUrl.replace(/^ws:\/\//, "wss://") : rawUrl;

    const ws = new WebSocket(`${safeUrl}?auth-token=${token}`);
    wsRef.current = ws;

    // normalise "BTC/USDT" → "BTC-USDT" for the backend subscription
    const normalisedPair = pair.replace("/", "-").toUpperCase();

    ws.onopen = () => {
      retryCountRef.current = 0;
      setData((prev) => ({ ...prev, isConnected: true }));
      ws.send(JSON.stringify({ type: "get_market_data", data: { pair: normalisedPair } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== "spot_margin_markets") return;

        const items: any[] = Array.isArray(msg.data?.data) ? msg.data.data : [];
        const match = items.find(
          (m) => (m.symbol || m.pair || "").replace("/", "-").toUpperCase() === normalisedPair
        );

        setData({
          price: match?.last_price ?? match?.lastPrice ?? match?.price ?? null,
          change24h: match?.price_change ?? match?.priceChange ?? match?.change24h ?? null,
          changePercent24h: match?.percent_change ?? match?.priceChangePercent ?? match?.changePercent24h ?? null,
          high24h: match?.high_24h ?? match?.highPrice ?? match?.high24h ?? null,
          low24h: match?.low_24h ?? match?.lowPrice ?? match?.low24h ?? null,
          volume24h: match?.volume ?? match?.volume24h ?? null,
          fundingRate: match?.funding_rate ?? match?.fundingRate ?? null,
          nextFundingTime: match?.next_funding_time ?? null,
          isConnected: true,
          lastUpdated: new Date(),
          markets: items,
        });
      } catch {
        // bad message — ignore
      }
    };

    ws.onclose = () => {
      setData((prev) => ({ ...prev, isConnected: false }));
      fetchHttpFallback();
      // exponential backoff: 2s → 4s → 8s → max 30s
      const backoff = Math.min(
        2000 * Math.pow(2, retryCountRef.current),
        30000
      );
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(connectWs, backoff);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [pair, fetchHttpFallback]);

  useEffect(() => {
    if (!MOCK_MODE.marketFeed) {
      fetchHttpFallback();
      connectWs();
    }

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  return data;
};
