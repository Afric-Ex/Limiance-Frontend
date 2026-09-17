"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/axios";
import { MOCK_MODE } from "@/src/mocks";
import { MOCK_PRICES } from "@/src/mocks/data/market-data";
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

function generateMockBook(basePrice: number): Pick<OrderBookData, "buyOrders" | "sellOrders"> {
  const buyOrders = Array.from({ length: 9 }, (_, i) => ({
    price: +(basePrice - (i + 1) * basePrice * 0.0005).toFixed(basePrice > 100 ? 2 : 4),
    quantity: +(Math.random() * 1.8 + 0.05).toFixed(4),
  }));
  const sellOrders = Array.from({ length: 9 }, (_, i) => ({
    price: +(basePrice + (i + 1) * basePrice * 0.0005).toFixed(basePrice > 100 ? 2 : 4),
    quantity: +(Math.random() * 1.8 + 0.05).toFixed(4),
  }));
  return { buyOrders, sellOrders };
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

  // --- mock mode ---
  useEffect(() => {
    if (!MOCK_MODE.orderBook) return;

    const basePrice = MOCK_PRICES[pair]?.price ?? 67000;
    const { buyOrders, sellOrders } = generateMockBook(basePrice);
    const totalBuy = buyOrders.reduce((s, o) => s + o.quantity, 0);
    const totalSell = sellOrders.reduce((s, o) => s + o.quantity, 0);
    const total = totalBuy + totalSell;

    setData({
      buyOrders,
      sellOrders,
      buyPercentage: total > 0 ? +((totalBuy / total) * 100).toFixed(1) : null,
      sellPercentage: total > 0 ? +((totalSell / total) * 100).toFixed(1) : null,
      totalBuyVolume: +totalBuy.toFixed(4),
      totalSellVolume: +totalSell.toFixed(4),
      isConnected: true,
      lastUpdated: new Date(),
    });
  }, [pair]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    if (MOCK_MODE.orderBook) return;

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
