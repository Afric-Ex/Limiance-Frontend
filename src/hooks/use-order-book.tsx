"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/axios";
import { wsClient } from "@/src/lib/websocket-client";

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

interface OrderBookData {
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
  buyPercentage: number | null;
  sellPercentage: number | null;
  totalBuyVolume: number | null;
  totalSellVolume: number | null;
  isConnected: boolean;
  lastUpdated: Date | null;
}

export type OrderBookMarket = "spot" | "margin" | "futures";

const wsPairForMarket = (pair: string, market: OrderBookMarket) =>
  market === "margin"
    ? pair.replace(/[/\\\-_\s]/g, "").toUpperCase()
    : pair.replace("/", "-");

export const useOrderBook = (pair: string, market: OrderBookMarket = "spot"): OrderBookData => {
  const [data, setData] = useState<OrderBookData>({
    buyOrders: [],
    sellOrders: [],
    buyPercentage: null,
    sellPercentage: null,
    totalBuyVolume: null,
    totalSellVolume: null,
    isConnected: false,
    lastUpdated: null,
  });

  const fetchHttpFallback = useCallback(async () => {
    // Margin order books are websocket-only — no HTTP fallback endpoint.
    if (market === "margin") return;
    try {
      const res = await api.get(`trading/${market}/orderbook`, { params: { symbol: pair } });
      const payload = res.data?.data || res.data || {};
      
      const rawBids = Array.isArray(payload.bids) ? payload.bids : [];
      const rawAsks = Array.isArray(payload.asks) ? payload.asks : [];

      const buyOrders = rawBids.slice(0, 50).map((b: any) => ({
        price: parseFloat(b.price ?? b[0] ?? "0"),
        quantity: parseFloat(b.quantity ?? b.size ?? b[1] ?? "0"),
      }));
      const sellOrders = rawAsks.slice(0, 50).map((a: any) => ({
        price: parseFloat(a.price ?? a[0] ?? "0"),
        quantity: parseFloat(a.quantity ?? a.size ?? a[1] ?? "0"),
      }));

      const totalBuy = buyOrders.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalSell = sellOrders.reduce((acc, curr) => acc + curr.quantity, 0);
      const total = totalBuy + totalSell;

      setData({
        buyOrders,
        sellOrders,
        buyPercentage: total > 0 ? +((totalBuy / total) * 100).toFixed(1) : null,
        sellPercentage: total > 0 ? +((totalSell / total) * 100).toFixed(1) : null,
        totalBuyVolume: totalBuy,
        totalSellVolume: totalSell,
        isConnected: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("HTTP fallback for orderbook failed", err);
    }
  }, [pair, market]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    fetchHttpFallback();

    const wsPair = wsPairForMarket(pair, market);
    const payload = { type: `get_${market}_order_books`, data: { pair: wsPair } };

    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected) {
        fetchHttpFallback();
      }
    });

    const unsubscribeMessages = wsClient.subscribe(
      "order_book_update",
      payload,
      (dataPayload) => {
        const book = dataPayload?.orderBook ?? dataPayload?.data?.orderBook ?? dataPayload;
        if (!book) return;

        const normalize = (entries: any): OrderBookEntry[] => {
          if (!Array.isArray(entries)) return [];
          return entries.slice(0, 50).map((e: any) => ({
            price: parseFloat(e.price ?? e[0] ?? "0"),
            quantity: parseFloat(e.quantity ?? e.size ?? e[1] ?? "0"),
          }));
        };

        const rawBuy = book.buyOrders ?? book.bids;
        const rawSell = book.sellOrders ?? book.asks;
        if (!Array.isArray(rawBuy) && !Array.isArray(rawSell)) return;

        const buyOrders = normalize(rawBuy);
        const sellOrders = normalize(rawSell);

        setData({
          buyOrders,
          sellOrders,
          buyPercentage: book.buyPercentage ?? null,
          sellPercentage: book.sellPercentage ?? null,
          totalBuyVolume: book.totalBuyVolume ?? null,
          totalSellVolume: book.totalSellVolume ?? null,
          isConnected: true,
          lastUpdated: new Date(),
        });
      }
    );

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, [pair, market, fetchHttpFallback]);

  return data;
};
