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

const normalizePair = (v: string) => String(v ?? "").replace(/[/\\\-_:\s]/g, "").toUpperCase();

// True when an incoming order-book symbol tag refers to the pair we requested.
// Strips separators and accepts a prefix match (some streams tag the book with
// an extended symbol like "BTCUSDT0929" or ":USDT" suffixes).
const symbolMatches = (tag: unknown, pair: string) => {
  if (!tag) return false;
  const a = normalizePair(String(tag));
  const b = normalizePair(pair);
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
};

// The pair string each market's order-book WS stream expects:
//   spot    → "BTC/USDT"   (slashed — the backend matches the pair with the
//                           slash separator, not the dashed "BTC-USDT" form)
//   margin  → "BTC/USDT"   (slashed — the payload API Dog verified;
//                            compact "BTCUSDT" and "BTC/USDT:margin" ack the
//                            stream but return null levels)
//   futures → "BTC/USDT"   (slashed — the backend matches the pair with the
//                           slash separator, not compact "BTCUSDT")
const wsPairForMarket = (pair: string, _market: OrderBookMarket) => {
  const raw = String(pair ?? "").trim().toUpperCase();
  const parts = raw.split(/[\/\-_:\s]+/).filter(Boolean);
  return parts.length === 2 ? `${parts[0]}/${parts[1]}` : raw;
};

// The backend pushes order books on a per-market response type:
//   spot/margin → "order_book_update"  (data.orderBook.{buyOrders,sellOrders})
//   futures     → "futures_order_book_update"   (data.{buy,sell} + markPrice)
const RESPONSE_TOPICS: Record<OrderBookMarket, string[]> = {
  spot: ["order_book_update"],
  margin: ["order_book_update"],
  futures: ["futures_order_book_update"],
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
  // Distinguishes "we got a book" from "we retried once and gave up", so the
  // heal timer can stand down entirely rather than waking every 3s forever.
  const healSucceeded = useRef(false);

  const fetchHttpFallback = useCallback(async () => {
    // Margin/futures order books are websocket-only — no HTTP endpoints exist
    // for them (they 404). Spot keeps HTTP as a fallback.
    if (market !== "spot") return;
    // Same rule for spot: a live socket is already delivering this book.
    if (wsClient.getIsConnected()) return;
    try {
      const res = await api.get(`trading/${market}/orderbook`, { params: { symbol: pair } });
      const payload = res.data?.data || res.data || {};

      // The REST envelope mirrors the websocket book: buyOrders/sellOrders.
      // bids/asks and buy/sell are accepted as aliases so the fallback keeps
      // working if the endpoint is normalised to the usual exchange shape.
      const rawBids = payload.buyOrders ?? payload.bids ?? payload.buy ?? payload.b;
      const rawAsks = payload.sellOrders ?? payload.asks ?? payload.sell ?? payload.a;
      if (!Array.isArray(rawBids) && !Array.isArray(rawAsks)) return;

      const normalize = (entries: any): OrderBookEntry[] =>
        (Array.isArray(entries) ? entries : [])
          .slice(0, 50)
          .map((e: any) => ({
            price: Number(e?.price ?? e?.p ?? e?.[0] ?? 0),
            quantity: Number(e?.quantity ?? e?.size ?? e?.q ?? e?.[1] ?? 0),
          }))
          .filter((e) => Number.isFinite(e.price) && e.price > 0 && Number.isFinite(e.quantity) && e.quantity > 0);

      const buyOrders = normalize(rawBids);
      const sellOrders = normalize(rawAsks);

      // Never let an empty REST snapshot wipe a live websocket book — this
      // fallback also re-runs on every disconnect, which would otherwise blank
      // the order book and the depth chart the moment the socket drops.
      if (buyOrders.length === 0 && sellOrders.length === 0) return;

      const totalBuy = buyOrders.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalSell = sellOrders.reduce((acc, curr) => acc + curr.quantity, 0);
      const total = totalBuy + totalSell;

      setData((prev) => ({
        buyOrders,
        sellOrders,
        buyPercentage: total > 0 ? +((totalBuy / total) * 100).toFixed(1) : null,
        sellPercentage: total > 0 ? +((totalSell / total) * 100).toFixed(1) : null,
        totalBuyVolume: totalBuy,
        totalSellVolume: totalSell,
        isConnected: prev.isConnected,
        lastUpdated: new Date(),
      }));
    } catch {
      // Book falls back to the last known values; nothing to surface here.
    }
  }, [pair, market]);

  // --- real mode: single shared WebSocket connection via wsClient ---
  useEffect(() => {
    fetchHttpFallback();
    receivedBookRef.current = false;
    healSucceeded.current = false;

    const wsPair = wsPairForMarket(pair, market);
    const payload = { type: `get_${market}_order_books`, data: { pair: wsPair } };

    // Only open the status listener while this screen is mounted — subscribing
    // to it with no stream active was what kept the socket warm on pages that
    // show no order book.
    let unsubscribeStatus: (() => void) | null = null;

    // Listen on every possible response topic for this market. All of them share
    // the same subscription payload and map into the same handler.
    const handleBookMessage = (dataPayload: any, rawMessage: any) => {
      // spot/margin nest the book under data.orderBook (or data.data.orderBook);
      // futures carry buy/sell directly on the payload.
      const book =
        dataPayload?.orderBook ??
        dataPayload?.order_book ??
        dataPayload?.data?.orderBook ??
        dataPayload?.data?.order_book ??
        dataPayload?.book ??
        dataPayload?.data ??
        dataPayload;
      if (!book) return;

      // The backend tags each order-book update with a symbol/pair. Only accept
      // the book for the pair we asked for, otherwise a shared stream can show
      // another pair's book or a stale one.
      const bookSymbol =
        dataPayload?.symbol ??
        dataPayload?.pair ??
        book?.symbol ??
        book?.pair ??
        rawMessage?.symbol ??
        rawMessage?.pair;
      if (bookSymbol && !symbolMatches(bookSymbol, pair)) return;

      const normalize = (entries: any): OrderBookEntry[] =>
        (Array.isArray(entries) ? entries : [])
          .slice(0, 50)
          .map((e: any) => ({
            price: Number(e?.price ?? e?.p ?? e?.[0] ?? 0),
            quantity: Number(e?.quantity ?? e?.size ?? e?.q ?? e?.[1] ?? 0),
          }))
          .filter((e) => Number.isFinite(e.price) && e.price > 0 && Number.isFinite(e.quantity) && e.quantity > 0);

      const rawBuy = book.buyOrders ?? book.bids ?? book.buy ?? book.b;
      const rawSell = book.sellOrders ?? book.asks ?? book.sell ?? book.a;
      if (!Array.isArray(rawBuy) && !Array.isArray(rawSell)) return;

      receivedBookRef.current = true;
      setData((previous) => {
        // Some futures feeds send incremental bid/ask updates instead of a
        // complete snapshot. Preserve the missing side rather than blanking it.
        const buyOrders = Array.isArray(rawBuy) ? normalize(rawBuy) : previous.buyOrders;
        const sellOrders = Array.isArray(rawSell) ? normalize(rawSell) : previous.sellOrders;
        const totalBuyVolume = buyOrders.reduce((sum, entry) => sum + entry.quantity, 0);
        const totalSellVolume = sellOrders.reduce((sum, entry) => sum + entry.quantity, 0);
        const total = totalBuyVolume + totalSellVolume;
        const buyPercentage = Number(book.buyPercentage ?? book.bidPercentage);
        const sellPercentage = Number(book.sellPercentage ?? book.askPercentage);

        return {
          buyOrders,
          sellOrders,
          buyPercentage: Number.isFinite(buyPercentage) ? buyPercentage : total > 0 ? (totalBuyVolume / total) * 100 : null,
          sellPercentage: Number.isFinite(sellPercentage) ? sellPercentage : total > 0 ? (totalSellVolume / total) * 100 : null,
          totalBuyVolume: Number.isFinite(Number(book.totalBuyVolume)) ? Number(book.totalBuyVolume) : totalBuyVolume,
          totalSellVolume: Number.isFinite(Number(book.totalSellVolume)) ? Number(book.totalSellVolume) : totalSellVolume,
          isConnected: true,
          lastUpdated: new Date(),
        };
      });
    };

    // Subscribe to the first response topic this market can use. The others are
    // alternates for backends that answer on a different channel — subscribing
    // to all of them cost one request frame each per pair for a stream that is
    // already open. If the primary stays silent, the heal timer below retries.
    const unsubscribeMessages = RESPONSE_TOPICS[market].map((topic) =>
      wsClient.subscribe(topic, payload, handleBookMessage)
    );

    unsubscribeStatus = wsClient.onStatusChange((connected) => {
      setData((prev) => ({ ...prev, isConnected: connected }));
      if (!connected) fetchHttpFallback();
    });

    // The backend sends a single order-book snapshot when a stream starts and
    // does not re-push it while the stream is already active. If that snapshot
    // is missed (e.g. subscribe races a reconnect), the book would stay empty,
    // so keep re-requesting the stream until an update has actually arrived.
    // Backs off to 10s once it has succeeded so an idle book costs nothing.
    const healTimer = setInterval(() => {
      if (receivedBookRef.current) {
        if (healSucceeded.current) return;
        healSucceeded.current = true;
        return;
      }
      if (wsClient.getIsConnected()) wsClient.send(payload);
    }, 3000);

    return () => {
      clearInterval(healTimer);
      unsubscribeStatus?.();
      unsubscribeMessages.forEach((unsubscribe) => unsubscribe());
    };
  }, [pair, market, fetchHttpFallback]);

  return data;
};
