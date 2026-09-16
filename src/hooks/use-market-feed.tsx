"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/axios";
import { MOCK_MODE } from "@/src/mocks";
import { MOCK_PRICES } from "@/src/mocks/data/market-data";
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
      }));
    } catch (err) {
      console.error("HTTP fallback for market feed failed", err);
    }
  }, [pair]);

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

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    if (MOCK_MODE.marketFeed) return;

    fetchHttpFallback();

    const normalisedPair = pair.replace("/", "-").toUpperCase();
    const payload = { type: "get_market_data", data: { pair: normalisedPair } };

    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected) {
        fetchHttpFallback();
      }
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
