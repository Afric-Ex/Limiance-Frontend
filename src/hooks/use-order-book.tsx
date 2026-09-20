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

export const useOrderBook = (pair: string): OrderBookData => {
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
    try {
      const wsPair = pair.replace("/", "-");
      const res = await api.get("trading/spot/orderbook", { params: { symbol: pair } });
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
  }, [pair]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    fetchHttpFallback();

    const wsPair = pair.replace("/", "-");
    const payload = { type: "get_spot_order_books", data: { pair: wsPair } };

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
        const book = dataPayload?.orderBook;
        if (!book) return;

        const buyOrders: OrderBookEntry[] = Array.isArray(book.buyOrders) ? book.buyOrders : [];
        const sellOrders: OrderBookEntry[] = Array.isArray(book.sellOrders) ? book.sellOrders : [];

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
  }, [pair, fetchHttpFallback]);

  return data;
};
