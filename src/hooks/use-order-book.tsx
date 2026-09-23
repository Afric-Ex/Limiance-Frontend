"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const normalizePair = (v: string) => String(v ?? "").replace(/[/\\\-_\s]/g, "").toUpperCase();

// The pair string each market's order-book WS stream expects:
//   spot    → "BTC-USDT"  (dashed, verified live)
//   margin  → "BTCUSDT"   (compact, verified live)
//   futures → "BTCUSDT"   (compact — the backend only emits a snapshot when
//                          the symbol matches exactly; dashed "BTC-USDT"
//                          starts the stream but never delivers data)
const wsPairForMarket = (pair: string, market: OrderBookMarket) =>
  market === "spot" ? pair.replace("/", "-").toUpperCase() : normalizePair(pair);

// The backend pushes order books on a per-market response type:
//   spot/margin → "order_book_update"           (data.orderBook.{buyOrders,sellOrders})
//   futures     → "futures_order_book_update"   (data.{buy,sell} + markPrice)
const RESPONSE_TOPIC: Record<OrderBookMarket, string> = {
  spot: "order_book_update",
  margin: "order_book_update",
  futures: "futures_order_book_update",
};

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

  // True once a book snapshot for the current pair has been received. Used to
  // self-heal when the backend only pushes one snapshot per stream start.
  const receivedBookRef = useRef(false);

  const fetchHttpFallback = useCallback(async () => {
    // Margin/futures order books are websocket-only — no HTTP endpoints exist
    // for them (they 404). Spot keeps HTTP as a fallback.
    if (market !== "spot") return;
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
    receivedBookRef.current = false;

    const wsPair = wsPairForMarket(pair, market);
    const payload = { type: `get_${market}_order_books`, data: { pair: wsPair } };
    const responseTopic = RESPONSE_TOPIC[market];

    const unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected) {
        fetchHttpFallback();
      }
    });

    const unsubscribeMessages = wsClient.subscribe(responseTopic, payload, (dataPayload) => {
      // spot/margin nest the book under data.orderBook; futures carry buy/sell
      // directly on the payload.
      const book = dataPayload?.orderBook ?? dataPayload;
      if (!book) return;

      // The backend tags each order-book update with a symbol/pair. Only accept
      // the book for the pair we asked for, otherwise a shared stream can show
      // another pair's book or a stale one.
      const bookSymbol = dataPayload?.symbol ?? dataPayload?.pair ?? book?.symbol;
      if (bookSymbol && normalizePair(bookSymbol) !== normalizePair(pair)) return;

      const normalize = (entries: any): OrderBookEntry[] => {
        if (!Array.isArray(entries)) return [];
        return entries.slice(0, 50).map((e: any) => ({
          price: parseFloat(e.price ?? e[0] ?? "0"),
          quantity: parseFloat(e.quantity ?? e.size ?? e[1] ?? "0"),
        }));
      };

      const rawBuy = book.buyOrders ?? book.bids ?? book.buy;
      const rawSell = book.sellOrders ?? book.asks ?? book.sell;
      if (!Array.isArray(rawBuy) && !Array.isArray(rawSell)) return;

      receivedBookRef.current = true;
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
    });

    // The backend sends a single order-book snapshot when a stream starts and
    // does not re-push it while the stream is already active. If that snapshot
    // is missed (e.g. subscribe races a reconnect), the book would stay empty,
    // so keep re-requesting the stream until an update has actually arrived.
    const healTimer = setInterval(() => {
      if (receivedBookRef.current) return;
      if (wsClient.getIsConnected()) wsClient.send(payload);
    }, 3000);

    return () => {
      clearInterval(healTimer);
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, [pair, market, fetchHttpFallback]);

  return data;
};